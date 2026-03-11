import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import { requireFeature } from '../middleware/planCheck';

const router = Router();

// GET /credits
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.userId },
      select: { smsCredits: true, whatsappCredits: true },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }

  res.json({ smsCredits: user.smsCredits, whatsappCredits: user.whatsappCredits, transactions });
});

// POST /credits/add — manuel kredi ekleme
router.post('/add', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, description, type = 'sms' } = req.body as { amount?: number; description?: string; type?: 'sms' | 'whatsapp' };

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Geçerli bir miktar girin (pozitif tam sayı)' });
    return;
  }

  const isWhatsapp = type === 'whatsapp';
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: isWhatsapp ? { whatsappCredits: { increment: amount } } : { smsCredits: { increment: amount } },
      select: { id: true, smsCredits: true, whatsappCredits: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: req.userId!,
        amount,
        type: isWhatsapp ? 'WHATSAPP_PURCHASE' : 'PURCHASE',
        description: description || `${amount} ${isWhatsapp ? 'WhatsApp' : 'SMS'} kredisi yüklendi`,
      },
    }),
  ]);

  res.json({ smsCredits: user.smsCredits, whatsappCredits: user.whatsappCredits, message: `${amount} ${isWhatsapp ? 'WhatsApp' : 'SMS'} kredisi eklendi` });
});

// GET /credits/invoice/:transactionId — PDF fatura indir
router.get('/invoice/:transactionId', authenticate, requireFeature('pdf_invoice'), async (req: AuthRequest, res: Response): Promise<void> => {
  const transactionId = parseInt(req.params['transactionId'] as string);
  if (isNaN(transactionId)) { res.status(400).json({ error: 'Geçersiz işlem ID' }); return; }

  const [transaction, user] = await Promise.all([
    prisma.creditTransaction.findFirst({
      where: { id: transactionId, userId: req.userId },
    }),
    prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, email: true },
    }),
  ]);

  if (!transaction || !user) { res.status(404).json({ error: 'İşlem bulunamadı' }); return; }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="chekkify-fatura-${transactionId}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  doc.pipe(res);

  // — Header bar —
  doc.rect(0, 0, 595, 90).fill('#1a0a2e');

  // Logo text
  doc.fillColor('#a855f7').fontSize(28).font('Helvetica-Bold').text('CHEKKIFY', 60, 30);
  doc.fillColor('#c4b5fd').fontSize(11).font('Helvetica').text('COD Doğrulama Platformu', 60, 62);

  // FATURA label (right side)
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('FATURA', 0, 34, { align: 'right', width: 535 });

  // — Invoice meta —
  doc.fillColor('#1f1035').fontSize(10).font('Helvetica');
  const metaY = 115;
  doc.fillColor('#6b7280').text('FATURA NO', 60, metaY);
  doc.fillColor('#1a1a2e').text(`#TXN-${String(transactionId).padStart(6, '0')}`, 60, metaY + 14);

  doc.fillColor('#6b7280').text('TARİH', 200, metaY);
  doc.fillColor('#1a1a2e').text(
    new Date(transaction.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
    200, metaY + 14
  );

  doc.fillColor('#6b7280').text('İŞLEM TÜRÜ', 340, metaY);
  doc.fillColor('#1a1a2e').text(transaction.type === 'PURCHASE' ? 'Satın Alma' : 'Kullanım', 340, metaY + 14);

  // Divider
  doc.moveTo(60, 160).lineTo(535, 160).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

  // — Billing info —
  const billY = 175;
  doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('FATURA KESİLEN', 60, billY);
  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(user.name || 'Ad Soyad', 60, billY + 14);
  doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(user.email, 60, billY + 30);

  // Tax number placeholder
  doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text('Vergi No / TC Kimlik No:', 60, billY + 48);
  doc.moveTo(180, billY + 58).lineTo(400, billY + 58).strokeColor('#d1d5db').lineWidth(0.5).stroke();

  // — Items table header —
  const tableY = 280;
  doc.rect(60, tableY, 475, 28).fill('#f3f4f6');
  doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold');
  doc.text('Ürün / Hizmet', 70, tableY + 9);
  doc.text('Miktar', 320, tableY + 9);
  doc.text('Tutar', 450, tableY + 9, { align: 'right', width: 75 });

  // — Items table row —
  const rowY = tableY + 28;
  doc.rect(60, rowY, 475, 36).fill('#ffffff').stroke('#e5e7eb');
  doc.fillColor('#111827').fontSize(10).font('Helvetica');
  doc.text(transaction.description || 'SMS Kredi Paketi', 70, rowY + 13);
  doc.text(`${transaction.amount} SMS Kredisi`, 320, rowY + 13);
  doc.fillColor(transaction.type === 'PURCHASE' ? '#059669' : '#7c3aed');
  doc.text(
    `${transaction.type === 'PURCHASE' ? '+' : ''}${transaction.amount}`,
    450, rowY + 13, { align: 'right', width: 75 }
  );

  // — Total box —
  const totalY = rowY + 60;
  doc.rect(350, totalY, 185, 44).fill('#1a0a2e');
  doc.fillColor('#c4b5fd').fontSize(10).font('Helvetica').text('TOPLAM KREDİ', 360, totalY + 8);
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(
    `${Math.abs(transaction.amount)} SMS`,
    360, totalY + 22, { width: 165, align: 'right' }
  );

  // — Footer —
  doc.moveTo(60, 720).lineTo(535, 720).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.fillColor('#9ca3af').fontSize(9).font('Helvetica');
  doc.text('Bu fatura Chekkify tarafından otomatik oluşturulmuştur.', 60, 730, { align: 'center', width: 475 });
  doc.text('chekkify.com — destek@chekkify.com', 60, 744, { align: 'center', width: 475 });

  doc.end();
});

export default router;
