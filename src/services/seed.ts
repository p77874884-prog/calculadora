import { CONTACTS } from './data';
import { type ChatMessage, type ChatMeta, type MessageKind, loadAll, persistAll, loadMeta, persistMeta } from './messageService';

interface SeedMessage {
  text: string;
  kind: MessageKind;
  fileName?: string;
  fileSize?: string;
  duration?: string;
  fromMe: boolean;
}

const SEEDS: Record<string, SeedMessage[]> = {
  ana: [
    { text: 'Oi! Tudo bem? 😊', kind: 'text', fromMe: false },
    { text: 'Tudo sim! E voce?', kind: 'text', fromMe: true },
    { text: 'Otimo! Vi que voce mandou o arquivo ontem', kind: 'text', fromMe: false },
    { text: 'Sim, esta na pasta compartilhada 📁', kind: 'text', fromMe: true },
    { text: 'Proposta-Final.pdf', kind: 'file', fileSize: '2.4 MB', fromMe: true },
    { text: 'Recebi! Vou revisar agora e te falo 👍', kind: 'text', fromMe: false },
    { text: 'Beleza, qualquer coisa me chama', kind: 'text', fromMe: true },
    { text: 'Ei, ficou show de bola! Aprovado ✅', kind: 'text', fromMe: false },
    { text: 'Bora celebrar? 🥳', kind: 'text', fromMe: true },
    { text: 'Claro! Amanha no bar de sempre', kind: 'text', fromMe: false },
  ],
  bruno: [
    { text: 'E aí, como ta o projeto?', kind: 'text', fromMe: true },
    { text: 'Ta fluindo, ja fiz 80%', kind: 'text', fromMe: false },
    { text: 'Precisa de ajuda?', kind: 'text', fromMe: true },
    { text: 'Nah, to tranquilo 💪', kind: 'text', fromMe: false },
    { text: 'Relatorio-Mensal.xlsx', kind: 'file', fileSize: '156 KB', fromMe: false },
    { text: 'Esse e o relatorio de agora', kind: 'text', fromMe: false },
    { text: 'Vou dar uma olhada, valeu!', kind: 'text', fromMe: true },
  ],
  carla: [
    { text: 'Gente, sabado tem aquele evento! 🎉', kind: 'text', fromMe: false },
    { text: 'Ja vi! Vai rolar?', kind: 'text', fromMe: true },
    { text: 'Com certeza, ja comprei o ingresso', kind: 'text', fromMe: false },
    { text: 'Manda o link depois', kind: 'text', fromMe: true },
    { text: 'Ta aqui: ingresso.com/evento-sabado 🎫', kind: 'text', fromMe: false },
    { text: 'Comprei! Vamos lotar isso 💃', kind: 'text', fromMe: true },
    { text: 'Simmmm!', kind: 'text', fromMe: false },
    { text: 'Amei esse evento! 😍', kind: 'text', fromMe: false },
  ],
  diego: [
    { text: '🎵 Audio de 0:42', kind: 'audio', duration: '0:42', fromMe: false },
    { text: 'Mandei o audio la', kind: 'text', fromMe: false },
    { text: 'Vou ouvir agora', kind: 'text', fromMe: true },
    { text: 'Por favor, urgente!', kind: 'text', fromMe: false },
    { text: 'Já ouvi, ta top! Vou mandar pro time', kind: 'text', fromMe: true },
    { text: 'Valeu demais! 🙏', kind: 'text', fromMe: false },
  ],
  elen: [
    { text: 'Oi! Voce viu as fotos do evento? 📸', kind: 'text', fromMe: false },
    { text: 'Ainda nao, manda ai', kind: 'text', fromMe: true },
    { text: 'Fotos-Evento.zip', kind: 'file', fileSize: '18.5 MB', fromMe: false },
    { text: 'Uau, ficaram incriveis! 🤩', kind: 'text', fromMe: true },
    { text: 'Né? Aquele amor ❤️', kind: 'text', fromMe: false },
    { text: '🎵 Audio de 1:15', kind: 'audio', duration: '1:15', fromMe: false },
    { text: 'Escuta esse audio, vai rir 😂', kind: 'text', fromMe: false },
    { text: 'HAHAHAHA morta 💀💀💀', kind: 'text', fromMe: true },
  ],
  felipe: [
    { text: 'Beleza,Combinei a reuniao pra terca', kind: 'text', fromMe: false },
    { text: 'Perfeito, que horas?', kind: 'text', fromMe: true },
    { text: '14h, no escritorio', kind: 'text', fromMe: false },
    { text: 'Fechado! Vou levar os docs 📋', kind: 'text', fromMe: true },
    { text: 'Contrato-Venda.pdf', kind: 'file', fileSize: '890 KB', fromMe: false },
    { text: 'Manda o contrato pra eu revisar', kind: 'text', fromMe: true },
    { text: 'Ja ta ai! Assina e me volta', kind: 'text', fromMe: false },
    { text: 'Vou revisar amanha e te mando ✍️', kind: 'text', fromMe: true },
  ],
  atelie: [
    { text: 'Olá! Seu pedido foi despachado 🚚', kind: 'text', fromMe: false },
    { text: 'Qual o prazo de entrega?', kind: 'text', fromMe: true },
    { text: '3 a 5 dias uteis', kind: 'text', fromMe: false },
    { text: 'Pode mandar o rastreio?', kind: 'text', fromMe: true },
    { text: 'Seu codigo de rastreio: BR123456789', kind: 'text', fromMe: false },
    { text: 'Rastreio-Pedido.pdf', kind: 'file', fileSize: '45 KB', fromMe: false },
    { text: 'Obrigado! Estou no aguardo 🙏', kind: 'text', fromMe: true },
    { text: 'Qualquer duvida, estamos aqui!', kind: 'text', fromMe: false },
  ],
  moda: [
    { text: '🔥 Colecao nova disponivel!', kind: 'text', fromMe: false },
    { text: 'Manda as fotos!', kind: 'text', fromMe: true },
    { text: 'Look-Nova-Colecao.jpg', kind: 'photo', fromMe: false },
    { text: 'Ficou lindo! 😍', kind: 'text', fromMe: true },
    { text: 'Tem 20% de desconto so hoje!', kind: 'text', fromMe: false },
    { text: 'Vou levar 3 pecas', kind: 'text', fromMe: true },
    { text: 'Perfeito! Te envio o link de pagamento 📲', kind: 'text', fromMe: false },
  ],
};

function makeMessage(contactId: string, seed: SeedMessage, createdAt: number): ChatMessage {
  return {
    ...seed,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'sent',
    createdAt,
  };
}

export async function seedMessagesIfEmpty(): Promise<void> {
  const allConversations = await loadAll();
  const allMeta = await loadMeta();
  let changed = false;

  for (const contact of CONTACTS) {
    if (allConversations[contact.id]?.length) continue;
    const seeds = SEEDS[contact.id] ?? [];
    if (!seeds.length) continue;

    changed = true;
    let baseTime = Date.now() - seeds.length * 60000;
    const msgs: ChatMessage[] = [];
    for (const seed of seeds) {
      msgs.push(makeMessage(contact.id, seed, baseTime));
      baseTime += 60000;
    }
    allConversations[contact.id] = msgs;
    allMeta[contact.id] = {
      ...(allMeta[contact.id] ?? {}),
      pinned: false,
      muted: false,
      archived: false,
      unreadCount: 0,
      typing: false,
      lastMessageAt: msgs[msgs.length - 1].createdAt,
    } as ChatMeta;
  }

  if (changed) {
    await persistAll(allConversations);
    await persistMeta(allMeta);
  }
}
