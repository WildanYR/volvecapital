import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import CodeBlock from '@tiptap/extension-code-block'
import mermaid from 'mermaid'
import { useEffect, useState } from 'react'
import { cn } from '@/dashboard/lib/utils'

const MermaidNodeView = ({ node, editor }: any) => {
  const { language } = node.attrs;
  const content = node.textContent;
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (language === 'mermaid' && content.trim()) {
      let isMounted = true;
      const renderMermaid = async () => {
        try {
          let sanitizedContent = content.trim();
          // Automatically remove ```mermaid and ``` if the user accidentally pastes them
          sanitizedContent = sanitizedContent.replace(/^```(mermaid)?\s*\n?/, '');
          sanitizedContent = sanitizedContent.replace(/\n?\s*```$/, '');
          
          mermaid.initialize({ 
            startOnLoad: false, 
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
            // Disable max-width so the diagram doesn't shrink and become unreadable
            flowchart: { useMaxWidth: false },
            sequence: { useMaxWidth: false },
            gantt: { useMaxWidth: false },
            journey: { useMaxWidth: false },
          });
          const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(id, sanitizedContent);
          if (isMounted) {
            setSvgContent(svg);
            setError(null);
          }
        } catch (e: any) {
          if (isMounted) {
            setError(e.message || 'Syntax Error');
            setSvgContent(null);
          }
        }
      };
      renderMermaid();
      return () => { isMounted = false; };
    } else {
      setSvgContent(null);
      setError(null);
    }
  }, [content, language]);

  const isMermaid = language === 'mermaid';

  return (
    <NodeViewWrapper className="relative my-4 group">
      {(!isMermaid || editor.isEditable) && (
        <pre className={cn(
          "rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto relative",
          language ? `language-${language}` : ''
        )}>
          <NodeViewContent as="code" className={language ? `language-${language}` : ''} />
        </pre>
      )}
      
      {isMermaid && (
        <div className={cn(
          "mermaid-preview bg-white dark:bg-zinc-950 border p-4 rounded-md overflow-auto min-h-[100px] max-h-[800px] text-center",
          editor.isEditable ? 'mt-2' : ''
        )}>
          {error ? (
            <div className="text-red-500 text-sm whitespace-pre-wrap text-left">{error}</div>
          ) : svgContent ? (
            <div 
              className="[&>svg]:max-w-none [&>svg]:h-auto transition-transform duration-200 inline-block text-left" 
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          ) : (
            <div className="text-muted-foreground text-sm italic inline-flex items-center justify-center h-full">Flowchart kosong atau sedang di-render...</div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const MermaidCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView)
  },
})
