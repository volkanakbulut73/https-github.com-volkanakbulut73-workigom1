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
    return "API anahtarı eksik olduğu için analiz yapılamıyor.";
  }

  const prompt = `
    Aşağıdaki yemek çeki teklifini bir alıcı gözüyle analiz et.
    Piyasa koşullarında yemek çekleri genellikle %10 ila %20 indirimle nakite çevrilir.
    
    Çek Bilgileri:
    Firma: ${voucher.company}
    Kart Bakiyesi: ${voucher.amount} TL
    Satış Fiyatı: ${voucher.price} TL
    Son Kullanma Tarihi: ${voucher.expiryDate}
    Konum: ${voucher.location}

    Lütfen kısa, samimi ve Türkçe bir tavsiye ver. 
    Bu iyi bir fırsat mı? Riskler neler olabilir? (Örn: Son kullanma tarihi yakın mı?)
    Cevabın 2-3 cümleyi geçmesin.
  `;

  try {
    // Model choice based on guidelines for Basic Text Tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster simple response
      }
    });

    // response.text is a getter property, not a method
    return response.text || "Analiz şu anda yapılamadı.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Yapay zeka servisine bağlanırken bir hata oluştu.";
  }
};