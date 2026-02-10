import { useEffect, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema, defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { exampleSetup } from 'prosemirror-example-setup';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-example-setup/style/style.css';
import './WYSIWYGEditor.css';

interface Props {
  content: string;
  onChange: (content: string) => void;
}

export default function WYSIWYGEditor({ content, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: defaultMarkdownParser.parse(content) || schema.node('doc', null, [schema.node('paragraph')]),
      plugins: exampleSetup({ schema })
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        if (transaction.docChanged && !isUpdatingRef.current) {
          const markdown = defaultMarkdownSerializer.serialize(newState.doc);
          onChange(markdown);
        }
      }
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Handle external content changes (e.g. from Source Mode)
  useEffect(() => {
    if (viewRef.current && !isUpdatingRef.current) {
      const currentMarkdown = defaultMarkdownSerializer.serialize(viewRef.current.state.doc);
      if (content !== currentMarkdown) {
        isUpdatingRef.current = true;
        const newDoc = defaultMarkdownParser.parse(content) || schema.node('doc', null, [schema.node('paragraph')]);
        const tr = viewRef.current.state.tr.replaceWith(0, viewRef.current.state.doc.content.size, newDoc.content);
        viewRef.current.dispatch(tr);
        isUpdatingRef.current = false;
      }
    }
  }, [content]);

  return (
    <div className="wysiwyg-editor-container h-full overflow-auto p-4 bg-white dark:bg-zinc-900">
      <div ref={editorRef} className="max-w-4xl mx-auto" />
    </div>
  );
}
