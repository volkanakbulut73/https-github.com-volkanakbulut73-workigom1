
import { GoogleGenAI, Type } from "@google/genai";
import { Voucher } from "../types";

const initAI = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not set in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeDealWithGemini = async (voucher: Voucher): Promise<string> => {
  const ai = initAI();
  if (!ai) {
    return "Analiz şu anda yapılamıyor.";
  }

  const prompt = `
    Sen bir Workigom Finansal Analistisin. Kullanıcıya bir yemek çeki teklifi hakkında profesyonel ama samimi bir tavsiye ver.
    
    Teklif Detayları:
    - Firma: ${voucher.company}
    - Bakiye: ${voucher.amount} TL
    - Satış Fiyatı: ${voucher.price} TL
    - Son Kullanma: ${voucher.expiryDate}
    - Konum: ${voucher.location}

    Analiz Kriterleri:
    1. İndirim Oranı: %15 ve üzeri ise 'Mükemmel Fırsat', %10-15 'İyi Teklif', %10 altı 'Standart' olarak nitelendir.
    2. Son Kullanma Tarihi: Yakınsa (1 aydan az) kullanıcıyı uyar.
    3. Genel Tavsiye: 2-3 cümlede, bu teklifi alıp almaması gerektiğini, nedenleriyle açıkla.
    
    Dil: Türkçe, Pozitif ve Kısa.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Bu teklif hakkında şu an yorum yapamıyorum.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Yapay zeka analizine şu an ulaşılamıyor.";
  }
};
