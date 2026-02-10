import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { FileText, Save, FolderOpen, Eye, Code, Download, Hash, List } from "lucide-react";
import WYSIWYGEditor from "./components/WYSIWYGEditor";
import SourceEditor from "./components/SourceEditor";
import markdownit from 'markdown-it';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const md = markdownit();

function App() {
  const [content, setContent] = useState("# Welcome to MarkdownForge\n\nStart editing your markdown file here.");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [mode, setMode] = useState<"wysiwyg" | "source">("source");
  const [isSaving, setIsSaving] = useState(false);

  // Generate outline from content
  const outline = useMemo(() => {
    const headings: { id: string, text: string, level: number }[] = [];
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        headings.push({
          id: `heading-${index}`,
          level: match[1].length,
          text: match[2]
        });
      }
    });
    return headings;
  }, [content]);

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }]
      });
      if (selected && typeof selected === 'string') {
        const fileContent = await invoke<string>("open_file", { path: selected });
        setContent(fileContent);
        setFilePath(selected);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const handleSaveFile = useCallback(async (currentContent: string, currentPath: string | null) => {
    let path = currentPath;
    try {
      if (!path) {
        const selected = await save({
          filters: [{ name: 'Markdown', extensions: ['md'] }]
        });
        if (!selected) return;
        path = selected;
        setFilePath(path);
      }
      setIsSaving(true);
      await invoke("save_file", { path, content: currentContent });
      setTimeout(() => setIsSaving(false), 1000);
    } catch (err) {
      console.error("Failed to save file:", err);
      setIsSaving(false);
    }
  }, []);

  const handleExportHTML = () => {
    const html = md.render(content);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-save effect (debounced)
  useEffect(() => {
    if (!filePath) return;
    const timeout = setTimeout(() => {
      handleSaveFile(content, filePath);
    }, 5000); // 5s debounce for auto-save
    return () => clearTimeout(timeout);
  }, [content, filePath, handleSaveFile]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      {/* Header / Toolbar */}
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1 rounded">
              <Hash className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">MarkdownForge</span>
          </div>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-2" />
          <div className="flex items-center gap-1">
            <button onClick={handleOpenFile} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Open File">
              <FolderOpen size={18} />
            </button>
            <button onClick={() => handleSaveFile(content, filePath)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Save File">
              <Save size={18} className={cn(isSaving && "text-indigo-500 animate-pulse")} />
            </button>
            <button onClick={handleExportHTML} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Export HTML">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setMode("wysiwyg")}
            className={cn("flex items-center gap-2 px-4 py-1 rounded-md text-sm font-medium transition-all duration-200", mode === "wysiwyg" ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100")}
          >
            <Eye size={14} /> WYSIWYG
          </button>
          <button
            onClick={() => setMode("source")}
            className={cn("flex items-center gap-2 px-4 py-1 rounded-md text-sm font-medium transition-all duration-200", mode === "source" ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100")}
          >
            <Code size={14} /> Source
          </button>
        </div>
      </header>

      {/* Main Content: 3-Column Architecture */}
      <main className="flex flex-1 overflow-hidden">
        {/* Column 1: Sidebar (Files) */}
        <aside className="w-64 border-r border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
             <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Files</h2>
          </div>
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 font-medium">
              <FileText size={16} />
              <span className="truncate">{filePath ? filePath.split(/[/\\]/).pop() : "untitled.md"}</span>
            </div>
          </div>
        </aside>

        {/* Column 2: Editor Area */}
        <div className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900">
          {mode === "wysiwyg" ? (
            <WYSIWYGEditor content={content} onChange={setContent} />
          ) : (
            <SourceEditor content={content} onChange={setContent} />
          )}
        </div>

        {/* Column 3: Outline */}
        <aside className="w-64 border-l border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 hidden xl:flex flex-col">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
             <List size={14} className="text-zinc-400" />
             <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Outline</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {outline.map((heading) => (
                <div
                  key={heading.id}
                  className={cn(
                    "text-xs truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
                    heading.level === 1 ? "font-bold" : "text-zinc-500",
                    heading.level === 2 && "pl-2",
                    heading.level === 3 && "pl-4",
                    heading.level > 3 && "pl-6"
                  )}
                  title={heading.text}
                >
                  {heading.text}
                </div>
              ))}
              {outline.length === 0 && (
                <p className="text-xs text-zinc-400 italic">No headings found</p>
              )}
            </nav>
          </div>
        </aside>
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-1.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>{filePath || "Ready"}</span>
          </div>
          <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-4 uppercase tracking-tight font-medium">
          <span>Markdown</span>
          <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
