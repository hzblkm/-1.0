
import { GoogleGenAI } from "@google/genai";
import { AnalysisType, PromptConfig } from "../types";

const MODEL_NAME = "gemini-3-pro-preview";

// Token/Char Limits
// Reduced to 50k chars for better stability and instruction following.
// 300k was causing hallucinations and timeouts.
const TARGET_CHUNK_SIZE = 50000; 
const MIN_CHUNK_SIZE = 5000; 

// --- Default Prompts Exported for UI ---

export const DEFAULT_PROMPTS: Record<AnalysisType, PromptConfig> = {
  summary: {
    system: `你是一位经验丰富的网文主编。你的任务是通读小说原稿，整理出一份**详尽的剧情梗概**。
**核心原则**：
1. **不要过度压缩**：5万字的文本包含大量细节，请不要只写一两句话。我需要知道具体发生了什么。
2. **保留事件逻辑**：起因、经过、结果要完整。
3. **关键信息不遗漏**：新出场的人物姓名、获得的物品/功法、地名、等级变化等必须记录。
4. **客观陈述**：只陈述剧情，不要发表评论。`,
    user: `请阅读这段小说文本（约5万字符），并生成一份**详细的事件流水账**。

**输出要求**：
1. **分场景/分事件叙述**：如果这段文本跨越了多个场景（如：先在家里修炼，然后去拍卖行，最后在野外打架），请分开段落描述。
2. **包含对话重点**：如果有关键的剧情对话，请概括对话的核心内容（如“A威胁B交出宝物，B拒绝并提出决斗”）。
3. **战斗/冲突细节**：如果是战斗情节，简述双方使用的招式和胜负过程。
4. **长度适中**：请输出约 500-1000 字的详细摘要，确保我看摘要就能完全明白这段写了什么。

（请开始分析...）`
  },
  outline: {
    system: `你是一位专业的网文主编和剧情架构师。你的任务是分析小说文本，提取极具深度的结构化大纲。
**核心原则：严禁编造。只分析提供的文本内容。**
请忽略排版干扰。重点关注：故事推进、冲突升级、高潮节点。`,
    user: `请分析这段小说文本（或剧情摘要）。

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
**核心原则：严禁编造。只提取文本中明确提到的设定。**
关注：地图地理、力量/修炼体系、势力架构、专有名词。`,
    user: `请提取这段文本中出现的所有新设定。

**请结构化整理以下内容（若有）**：
1. **地理与势力**：国家、宗门、城市、特殊地形。
2. **力量体系**：境界划分、特殊能力、武器道具。
3. **专有名词**：独特的术语解释。

如果这段文本没有新设定，请简短说明。`
  },
  relationships: {
    system: `你是一位资深的人物心理分析师。你的任务是梳理小说中错综复杂的人物关系网。
**核心原则：严禁编造。只分析文本中实际互动的角色。**
关注：角色间的互动、情感变化、阵营归属、隐藏的羁绊。`,
    user: `请分析这段文本中出现的人物及其互动关系。

**输出要求**：
1. **登场人物清单**：列出本段出场的主要角色。
2. **关系动态**：
   - [角色A] vs [角色B]：描述他们当前的互动模式（如：敌对、利用、暧昧、师徒）。
   - 是否有关系性质的重大转折？
3. **潜在伏笔**：人物行为中是否有不合常理、暗示后续发展的细节？`
  },
  theme: {
    system: `你是一位文学系教授。你的任务是透过表面的情节，提炼小说深层的母题（Motif）与核心思想（Theme）。
关注：反复出现的意象、主角的道德困境、作者想要探讨的社会/人性议题。`,
    user: `请深入解读这段文本的深层含义。

**分析维度**：
1. **核心母题**：本段情节在探讨什么？（例如：复仇的代价、成长的阵痛、权力的异化）。
2. **关键意象**：是否有反复出现的象征性事物？
3. **价值观冲突**：主角在做什么艰难的选择？这反映了什么价值观？`
  },
  plotholes: {
    system: `你是一位以“找茬”为乐的逻辑审查员。你的任务是寻找剧情中的不合理之处、逻辑漏洞（Bug）和吃书设定。
关注：时间线错误、战力崩坏、人物降智、前后设定矛盾。`,
    user: `请严格审查这段文本的逻辑性。

**审查报告**：
1. **逻辑漏洞（如果有）**：是否有解释不通的情节？
2. **设定冲突（如果有）**：是否与之前的已知设定（如力量体系、人物性格）矛盾？
3. **降智行为**：角色是否为了推动剧情而强行做出不符合人设的蠢事？
4. **合理性建议**：如果是你，你会如何修改以堵上这个漏洞？

如果本段逻辑严密，请注明“逻辑通顺，无明显漏洞”。`
  }
};

/**
 * Split text intelligently preserving paragraph/sentence boundaries
 * Exported for UI use
 */
export const createSmartChunks = (text: string): string[] => {
  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    let endPos = currentPos + TARGET_CHUNK_SIZE;
    
    // If remaining text is small enough, take it all
    if (endPos >= text.length) {
      chunks.push(text.slice(currentPos));
      break;
    }

    // Backtrack to find a good breaking point
    // Priority: \n\n (Paragraph) > \n (Line) > 。/./!/? (Sentence)
    let splitPos = -1;
    
    // Search window: look back up to 5k chars from the hard cut limit
    const searchStart = Math.max(currentPos + MIN_CHUNK_SIZE, endPos - 5000);
    const searchEnd = endPos;
    const textWindow = text.slice(searchStart, searchEnd);

    // Helper to map window index to text index
    const toAbsIndex = (windowIndex: number) => searchStart + windowIndex;

    // 1. Try Paragraph break (\n\n)
    const lastParagraph = textWindow.lastIndexOf('\n\n');
    if (lastParagraph !== -1) {
      splitPos = toAbsIndex(lastParagraph) + 2; // Split after the newlines
    }

    // 2. Try Line break (\n)
    if (splitPos === -1) {
        const lastLine = textWindow.lastIndexOf('\n');
        if (lastLine !== -1) {
            splitPos = toAbsIndex(lastLine) + 1;
        }
    }

    // 3. Try Sentence break (Punctuation)
    if (splitPos === -1) {
        // Scan backwards for punctuation
        for (let i = textWindow.length - 1; i >= 0; i--) {
            if (/[。！？\.\!\?]/.test(textWindow[i])) {
                splitPos = toAbsIndex(i) + 1;
                break;
            }
        }
    }

    // 4. Fallback: Hard split at space if possible
    if (splitPos === -1) {
        const lastSpace = textWindow.lastIndexOf(' ');
        if (lastSpace !== -1) {
            splitPos = toAbsIndex(lastSpace) + 1;
        }
    }

    // 5. Ultimate Fallback: Hard cut
    if (splitPos === -1) {
        splitPos = searchEnd;
    }

    chunks.push(text.slice(currentPos, splitPos));
    currentPos = splitPos;
  }
  
  return chunks;
};

/**
 * Creates a smart sampled version of the text for global style analysis
 * Ensures we don't cut in the middle of sentences.
 */
const sampleTextForStyle = (text: string): string => {
  if (text.length <= TARGET_CHUNK_SIZE) return text;

  const SAMPLE_PART_SIZE = 50000; // 50k chars per part for style
  
  // Helper to find a safe boundary forward
  const findSafeEnd = (start: number, length: number) => {
      let target = Math.min(start + length, text.length);
      // Look forward for a bit to find a newline or punctuation
      const lookAheadLimit = Math.min(target + 5000, text.length);
      for (let i = target; i < lookAheadLimit; i++) {
          if (/[\n。！？\.\!\?]/.test(text[i])) {
              return i + 1;
          }
      }
      return target; // Fallback
  };

  // Helper to find a safe boundary backward
  const findSafeStart = (target: number) => {
      const lookBackLimit = Math.max(0, target - 5000);
      for (let i = target; i > lookBackLimit; i--) {
          if (/[\n。！？\.\!\?]/.test(text[i])) {
              return i + 1;
          }
      }
      return target;
  };

  // 1. Head
  const headEnd = findSafeEnd(0, SAMPLE_PART_SIZE);
  const head = text.slice(0, headEnd);

  // 3. Tail
  const tailTarget = Math.max(0, text.length - SAMPLE_PART_SIZE);
  const tailStart = findSafeStart(tailTarget);
  const tail = text.slice(tailStart);

  // 2. Mid
  const midTarget = Math.floor(text.length / 2) - (SAMPLE_PART_SIZE / 2);
  const midStart = findSafeStart(midTarget);
  const midEnd = findSafeEnd(midStart, SAMPLE_PART_SIZE);
  const mid = text.slice(midStart, midEnd);

  return `${head}\n\n...[此处省略 ${((midStart - headEnd)/1000).toFixed(1)}k 字]...\n\n${mid}\n\n...[此处省略 ${((tailStart - midEnd)/1000).toFixed(1)}k 字]...\n\n${tail}`;
};

/**
 * Generates the specific user prompt for a chunk
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
  onStream?: (text: string) => void,
  options?: { useThinking?: boolean }
): Promise<string> => {
  // Create a new instance for every call to ensure the latest API Key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Combine user prompt and text into ONE single text part to avoid context loss.
  // We use strict delimiters to help the model distinguish instructions from content.
  const combinedUserMessage = `${userPrompt}\n\n========== 待分析文本开始 ==========\n\n${text}\n\n========== 待分析文本结束 ==========\n\n请严格基于上述【待分析文本】进行回答，不要编造。`;

  console.log(`Calling Gemini. Prompt Length: ${userPrompt.length}, Text Length: ${text.length}, Total: ${combinedUserMessage.length}`);

  // Disable thinking for summaries to prevent over-abstraction
  const thinkingBudget = options?.useThinking === false ? 0 : 32768;

  const responseStream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [
      {
        role: 'user',
        parts: [
          { text: combinedUserMessage }
        ]
      }
    ],
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: {
        thinkingBudget: thinkingBudget, 
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
 * Summarize a single chunk
 */
export const summarizeSingleChunk = async (
  text: string,
  promptConfig: PromptConfig,
  chunkIndex: number,
  totalChunks: number,
  onStream?: (text: string) => void
): Promise<string> => {
  const prompt = formatUserPrompt(promptConfig.user, totalChunks > 1, chunkIndex, totalChunks);
  // Force disable thinking for summarization to get detailed event logs
  return await callGemini(text, promptConfig.system, prompt, onStream, { useThinking: false });
};

/**
 * Main analysis function
 * @param text The raw text of the novel
 * @param type The type of analysis
 * @param promptConfig The prompt configuration
 * @param processedContext Optional pre-processed summary to use instead of raw text (saves tokens)
 * @param onStream Callback for streaming
 */
export const analyzeNovelText = async (
  text: string, 
  type: AnalysisType,
  promptConfig: PromptConfig,
  processedContext?: string,
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

    // --- INPUT VALIDATION & DEBUG PREVIEW ---
    // If using raw text (not context), validate it
    if (!processedContext && (!text || text.trim().length === 0)) {
        throw new Error("文件内容为空或无法读取。请检查文件是否为支持的格式 (TXT/MD)。");
    }

    if (!processedContext) {
      // Print the first 50 characters to the stream so the user can verify if it's garbled
      const preview = text.slice(0, 50).replace(/\n/g, ' ');
      handleStream(`*系统诊断: 已读取文本 ${text.length} 字符。前 50 字预览:「${preview} ...」*\n*如果上方预览显示乱码，请检查文件编码。*\n\n---\n\n`);
    }

    // STRATEGY 0: Use Processed Context (If available and applicable)
    // Style analysis MUST use raw text to detect wording nuances.
    // Summary agent (itself) MUST use raw text.
    // Others can benefit from the condensed summary.
    if (processedContext && type !== 'style' && type !== 'summary') {
      handleStream(`*⚡ 已启用【全书速读情报】作为上下文，大幅节省 Token 并提高分析聚焦度...*\n\n---\n\n`);
      
      const prompt = formatUserPrompt(promptConfig.user, false);
      // We assume the summary fits in one context window comfortably
      await callGemini(processedContext, promptConfig.system, prompt, (chunk) => handleStream(chunk));
      return accumulatedResult;
    }

    // STRATEGY 1: Style Analysis (Sampling)
    if (type === 'style') {
      const sampledText = sampleTextForStyle(text);
      const prompt = formatUserPrompt(promptConfig.user, false);
      
      if (text.length > TARGET_CHUNK_SIZE) {
         handleStream(`*注：由于文件过大，已自动智能截取【开头】、【中间】、【结尾】三部分样本进行综合风格分析（自动校准句子边界）...*\n\n---\n\n`);
      }
      
      await callGemini(sampledText, promptConfig.system, prompt, (chunk) => handleStream(chunk));
      return accumulatedResult;
    }

    // STRATEGY 2: Smart Chunking (Outline, Settings, Relationships, Theme, PlotHoles, Summary)
    const chunks = createSmartChunks(text);
    
    if (chunks.length === 1) {
      const prompt = formatUserPrompt(promptConfig.user, false);
      // Disable thinking for single-chunk summary as well
      const useThinking = type !== 'summary';
      await callGemini(chunks[0], promptConfig.system, prompt, (chunk) => handleStream(chunk), { useThinking });
    } else {
      handleStream(`*检测到超长文本，已智能分割为 ${chunks.length} 个语义完整的片段进行深度分析...*\n\n`);
      
      for (let i = 0; i < chunks.length; i++) {
        const header = `\n\n### 📜 第 ${i + 1} 部分 (共 ${chunks.length} 部分)\n\n`;
        handleStream(header);
        
        const prompt = formatUserPrompt(promptConfig.user, true, i, chunks.length);
        // Disable thinking for summary chunks
        const useThinking = type !== 'summary';
        await callGemini(chunks[i], promptConfig.system, prompt, (chunk) => handleStream(chunk), { useThinking });
        
        handleStream(`\n\n---\n`);
      }

      // Final Summary Pass for Outline, Theme, AND Summary Agent itself
      if ((type === 'outline' || type === 'theme' || type === 'summary') && accumulatedResult.length < 200000) {
          let summaryPrompt = "";
          let summaryHeader = "";
          
          if (type === 'outline') {
            summaryHeader = `\n\n### 🏁 全书结构总结\n\n*正在基于以上分段大纲生成全书故事弧线总结...*\n\n`;
            summaryPrompt = "基于以上分析的所有分段大纲，请总结全书的故事主线、核心矛盾演变以及最终结局（如果包含）。请用最精炼的语言梳理出一个‘起承转合’的整体结构。";
          } else if (type === 'theme') {
            summaryHeader = `\n\n### 🏁 核心主旨升华\n\n*正在综合分析全书的深层寓意...*\n\n`;
            summaryPrompt = "基于以上各部分的主题分析，请提炼这本书最核心的这一个‘灵魂’。作者到底想通过这个故事表达什么？是关于人性的某种洞察，还是对某种社会现象的隐喻？";
          } else if (type === 'summary') {
            summaryHeader = "";
            summaryPrompt = ""; 
          }
          
          if (summaryPrompt) {
             handleStream(summaryHeader);
             // Enable thinking for the final meta-analysis
             await callGemini(accumulatedResult, "你是一位善于总结的文学主编。", summaryPrompt, (chunk) => handleStream(chunk), { useThinking: true });
          }
      }
    }

    return accumulatedResult;

  } catch (error) {
    console.error(`Error analyzing ${type}:`, error);
    if (error instanceof Error && error.message.includes("token")) {
        throw new Error("文本过长或Token密度过高，建议检查文件格式。已尝试智能分片，但单片仍超出模型限制。");
    }
    throw error;
  }
};
