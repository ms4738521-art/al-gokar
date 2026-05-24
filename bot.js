
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const OWNERS = ['196503897403572', '2294150094923', '267375354060916'];

function decorate(text) {
    return `『 🃏 ${text} 🃏 』`;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    const sock = makeWASocket({ logger: pino({ level: 'silent' }), auth: state });

    sock.ev.on('connection.update', (update) => {
        if (update.qr) qrcode.generate(update.qr, { small: true });
        if (update.connection === 'open') console.log('👑 مملكة الجوكر تحت سيطرة الملوك!');
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const senderFull = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderFull.split('@')[0];
        const isFromMe = msg.key.fromMe; // هل الرسالة من البوت؟

        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();

        // 1. نظام الحظر (يتجاهل رسائل البوت نفسه)
        if (!isFromMe) {
            const badWords = ['كسمك', 'عرص', 'لبوه', 'خول', 'شرموطه', 'فاجره', 'متناك', 'علق', 'نياك', 'كس', 'زب', 'طيز', 'بزاز', 'ياعرص', 'امك', 'ابوك', 'شمال', 'زانية', 'ديوث', 'عرصات', 'سكس'];
            if (badWords.some(w => text.includes(w)) || text.includes('http')) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.groupParticipantsUpdate(from, [senderFull], 'remove');
                await sock.sendMessage(from, { text: decorate('تم الطرد يا قليل الأدب!') });
                return;
            }
        }

        // 2. أوامر الملوك
        if (OWNERS.includes(senderNumber)) {
            if (text === '.lock') {
                for (let i = 3; i > 0; i--) { await sock.sendMessage(from, { text: decorate(i.toString()) }); await new Promise(r => setTimeout(r, 1000)); }
                await sock.groupSettingUpdate(from, 'announcement');
                await sock.sendMessage(from, { text: decorate('تم قفل المملكة.. محدش يتنفس!') });
            }
            if (text === '.unlock') {
                for (let i = 3; i > 0; i--) { await sock.sendMessage(from, { text: decorate(i.toString()) }); await new Promise(r => setTimeout(r, 1000)); }
                await sock.groupSettingUpdate(from, 'not_announcement');
                await sock.sendMessage(from, { text: decorate('تم فتح المملكة.. ابدأوا الشغل!') });
            }
            if (text === 'الجوكر') await sock.sendMessage(from, { text: decorate('أؤمر يا سيد الأسياد.. أنا ملك الموت تحت إيدك.') });
            if (text === 'حب الجوكر') await sock.sendMessage(from, { text: decorate('حور هي نبض قلبي، هي النور اللي منور مملكتي، ومن غيرها الجوكر يضيع في الضلمة.') });
            if (text === 'القوانين') await sock.sendMessage(from, { text: decorate('قوانين المملكة:\n1. عدم دخول بنات خاص.\n2. ممنوع الشتايم.\n3. التعامل باحترام وممنوع الليناكت!') });
            if (text === 'جروب اي') await sock.sendMessage(from, { text: decorate(`آيدي الجروب: ${from}`) });

            if (text.startsWith('طير')) {
                const target = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (target) {
                    await sock.groupParticipantsUpdate(from, [target], 'remove');
                    await sock.sendMessage(from, { text: decorate('تم طرد العيل ده من مملكتي!') });
                }
            }
            if (text.startsWith('.ترقية')) {
                const target = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (target) {
                    await sock.groupParticipantsUpdate(from, [target], 'promote');
                    await sock.sendMessage(from, { text: decorate('تمت الترقية يا قلبي.') });
                }
            }
            if (text.startsWith('.تنزيل')) {
                const target = msg.message.extendedTextMessage?.contextInfo?.participant;
                if (target) {
                    await sock.groupParticipantsUpdate(from, [target], 'demote');
                    await sock.sendMessage(from, { text: decorate('تم التنزيل يا علق.') });
                }
            }
        }
    });
}
startBot();
