import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Yapay zeka için API anahtarı (GEMINI_API_KEY) yapılandırılmamış." }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const formData = await req.formData();
        const file = formData.get("image") as File;
        
        if (!file) {
            return NextResponse.json({ error: "Görsel yüklenmedi." }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Lütfen bu görseldeki film, dizi, belgesel veya TV programının adını tespit et. Görsel bir afiş, TV ekranı fotoğrafı veya bir sahne olabilir. SADECE yapımın adını yaz. Başka hiçbir kelime, ek açıklama veya noktalama işareti kullanma. (Örnek çıktı: Kurtlar Vadisi). Eğer hiçbir şey tespit edemezsen sadece 'BULUNAMADI' yaz." },
                        {
                            inlineData: {
                                data: base64Image,
                                mimeType: file.type
                            }
                        }
                    ]
                }
            ]
        });

        const text = response.text?.trim() || "";

        if (!text || text === "BULUNAMADI" || text.includes("BULUNAMADI")) {
            return NextResponse.json({ result: null });
        }

        return NextResponse.json({ result: text });

    } catch (error) {
        console.error("AI Recognition Error:", error);
        return NextResponse.json({ error: "Yapay zeka taraması sırasında bir hata oluştu." }, { status: 500 });
    }
}
