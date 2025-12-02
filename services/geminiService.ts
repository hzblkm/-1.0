
import { GoogleGenAI } from "@google/genai";
import { AnalysisType, PromptConfig } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-pro-preview";

// Token Safety Limits
const SAFE_CHUNK_SIZE = 400000; 
const CHUNK_OVERLAP = 2000;

// --- Default Prompts Exported for UI ---

export const DEFAULT_PROMPTS: Record<AnalysisType, PromptConfig> = {
  outline: {
    system: `你是一位专业的网文主编和剧情架构师。你的任务是分析小说文本，提取极具深度的结构化大纲。
请忽略排版干扰。重点关注：故事推进、冲突升级、高潮节点。`,
    user: `请分析这段小说文本。

**输出要求（Markdown）**：
1. **本段剧情概括**：用一句话总结这部分讲了什么。
2. **详细章纲/事件流**：
   - 按情节发生顺序，列出关键事件。
   - 标注【高潮】、【转折】、【伏笔】等标签。
   - 如果这部分包含具体的章节划分（如第X章），请明确列出章节标题。

注意：请保持客观、精炼。`
  },
  style: {
    system: `你是一位毒舌又专业的文学评论家。你的任务是剖析小说的“文风”与“骨相”。
关注：叙事视角、用词习惯、情感密度、人物对话风格。`,
    user: `请基于这份文本样本进行全书写作风格的深度评测。

**分析维度**：
1. **叙事节奏**：是快节奏爽文，还是慢热铺垫？
2. **语言特色**：请摘录1-2个例句进行点评（如：华丽堆砌、干练白描、幽默玩梗）。
3. **人物刻画**：作者擅长通过什么方式立人设？
4. **情感基调**：读起来的感觉（热血、压抑、温馨、悬疑）。
5. **主编点评**：客观评价其优缺点。`
  },
  settings: {
    system: `你是一位奇幻/科幻设定集编纂者。你的任务是挖掘文本中隐含的世界观设定。
关注：地图地理、力量/修炼体系、势力架构、专有名词。`,
    user: `请提取这段文本中出现的所有新设定。

**请结构化整理以下内容（若有）**：
- **地理与势力**：国家、宗门、城市、特殊地形。
- **力量体系**：境界划分、特殊能力、武器道具。
- **人物关系**：新登场的重要人物及其身份。
- **专有名词**：独特的术语解释。

如果这段文本没有新设定，请简短说明。`
  }
};

/**
 * Splits text into overlapping chunks
 */
const createChunks = (text: string): string[] => {
  if (text.length <= SAFE_CHUNK_SIZE) return [text];
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + SAFE_CHUNK_SIZE, text.length);
    chunks.push(text.slice(startIndex, endIndex));
    
    if (endIndex === text.length) break;
    startIndex += (SAFE_CHUNK_SIZE - CHUNK_OVERLAP);
  }
  
  return chunks;
};

/**
 * Creates a sampled version of the text for global style analysis
 */
const sampleTextForStyle = (text: string): string => {
  if (text.length <= SAFE_CHUNK_SIZE) return text;

  const sliceSize = 150000; 
  const start = text.slice(0, sliceSize);
  
  const midIndex = Math.floor(text.length / 2) - Math.floor(sliceSize / 2);
  const mid = text.slice(midIndex, midIndex + sliceSize);
  
  const end = text.slice(text.length - sliceSize);
  
  return `${start}\n\n...[此处省略中间内容]...\n\n${mid}\n\n...[此处省略中间内容]...\n\n${end}`;
};

/**
 * Generates the specific user prompt for a chunk by appending context to the user's custom prompt
 */
const formatUserPrompt = (basePrompt: string, isPartial: boolean, chunkIndex?: number, total?: number): string => {
  const progressStr = isPartial && total ? `(当前正在分析第 ${chunkIndex! + 1}/${total} 部分)` : "";
  return `${basePrompt}\n\n${progressStr}`;
};

/**
 * Calls Gemini API for a single chunk
 */
const callGemini = async (
  text: string, 
  systemInstruction: string,
  userPrompt: string,
  onStream?: (text: string) => void
): Promise<string> => {
  const responseStream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [
      {
        role: 'user',
        parts: [
          { text: userPrompt },
          { text: `\n\n--- 待分析文本 ---\n\n${text}` }
        ]
      }
    ],
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: {
        thinkingBudget: 1024, 
      },
    }
  });

  let fullText = "";
  for await (const chunk of responseStream) {
    const chunkText = chunk.text;
    if (chunkText) {
      fullText += chunkText;
      if (onStream) onStream(chunkText);
    }
  }
  return fullText;
};

/**
 * Main analysis function
 */
export const analyzeNovelText = async (
  text: string, 
  type: AnalysisType,
  promptConfig: PromptConfig,
  onStream?: (chunkText: string) => void
): Promise<string> => {
  try {
    let accumulatedResult = "";
    
    const handleStream = (newContent: string) => {
      accumulatedResult += newContent;
      if (onStream) {
        onStream(accumulatedResult);
      }
    };

    // STRATEGY 1: Style Analysis (Sampling)
    if (type === 'style') {
      const sampledText = sampleTextForStyle(text);
      const prompt = formatUserPrompt(promptConfig.user, false);
      
      if (text.length > SAFE_CHUNK_SIZE) {
         handleStream(`*注：由于文件过大，已自动截取【开头】、【中间】、【结尾】三部分样本进行综合风格分析...*\n\n---\n\n`);
      }
      
      await callGemini(sampledText, promptConfig.system, prompt, (chunk) => handleStream(chunk));
      return accumulatedResult;
    }

    // STRATEGY 2: Sequential Chunking (Outline & Settings)
    const chunks = createChunks(text);
    
    if (chunks.length === 1) {
      const prompt = formatUserPrompt(promptConfig.user, false);
      await callGemini(chunks[0], promptConfig.system, prompt, (chunk) => handleStream(chunk));
    } else {
      handleStream(`*检测到超长文本 (${chunks.length} 个部分)，正在分段深度分析中...*\n\n`);
      
      for (let i = 0; i < chunks.length; i++) {
        const header = `\n\n### 📜 第 ${i + 1} 部分分析 (共 ${chunks.length} 部分)\n\n`;
        handleStream(header);
        
        const prompt = formatUserPrompt(promptConfig.user, true, i, chunks.length);
        
        await callGemini(chunks[i], promptConfig.system, prompt, (chunk) => handleStream(chunk));
        
        handleStream(`\n\n---\n`);
      }
    }

    return accumulatedResult;

  } catch (error) {
    console.error(`Error analyzing ${type}:`, error);
    if (error instanceof Error && error.message.includes("token")) {
        throw new Error("文本过长，尽管已尝试分片，单片内容仍超过模型限制。建议检查文本是否包含大量非文本字符。");
    }
    throw error;
  }
};
