import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CodeBlockProps {
  code: string;
  language: "bash" | "python" | "javascript" | "typescript" | "json";
  label?: string;
  icon?: React.ReactNode;
  showCopy?: boolean;
}

const CodeBlock = ({ code, language, label, icon, showCopy = true }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-[#282c34] overflow-hidden">
      {(label || showCopy) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-[#21252b]">
          <div className="flex items-center gap-2">
            {icon}
            {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
          </div>
          {showCopy && (
            <button
              onClick={handleCopy}
              className="rounded p-1.5 transition-colors hover:bg-white/10"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      )}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.75rem",
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
