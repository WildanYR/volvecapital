import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Youtube from '@tiptap/extension-youtube';
import ImageResize from 'tiptap-extension-resize-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Unlink, Image as ImageIcon, Youtube as YoutubeIcon, Undo, Redo, Workflow } from 'lucide-react';
import { cn } from '@/dashboard/lib/utils';
import { Button } from '@/dashboard/components/ui/button';
import { Input } from '@/dashboard/components/ui/input';
import { useState } from 'react';
import { MermaidCodeBlock } from './mermaid-extension';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/dashboard/components/ui/dialog';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setIsImageOpen(false);
    }
  };

  const addYoutubeVideo = () => {
    if (youtubeUrl) {
      editor.commands.setYoutubeVideo({
        src: youtubeUrl,
        width: Math.max(320, parseInt(editor.view.dom.clientWidth, 10)) || 640,
        height: Math.max(180, parseInt(editor.view.dom.clientWidth, 10) * 0.5625) || 360,
      });
      setYoutubeUrl('');
      setIsYoutubeOpen(false);
    }
  };

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setIsLinkOpen(false);
    }
  };

  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap gap-1">
      <button
        type="button"
        title="Tebal (Bold)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('bold') ? 'bg-muted' : '')}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Miring (Italic)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('italic') ? 'bg-muted' : '')}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Coret (Strikethrough)"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('strike') ? 'bg-muted' : '')}
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Garis Bawah (Underline)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('underline') ? 'bg-muted' : '')}
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <div className="flex items-center gap-1">
        <input
          type="color"
          onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer outline-none"
          title="Warna Teks"
        />
      </div>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <button
        type="button"
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('heading', { level: 1 }) ? 'bg-muted' : '')}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('heading', { level: 2 }) ? 'bg-muted' : '')}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <button
        type="button"
        title="Bullet List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('bulletList') ? 'bg-muted' : '')}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Numbered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('orderedList') ? 'bg-muted' : '')}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <button
        type="button"
        title="Rata Kiri"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : '')}
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Rata Tengah"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : '')}
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Rata Kanan"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : '')}
      >
        <AlignRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Ratakan (Justify)"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : '')}
      >
        <AlignJustify className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogTrigger asChild>
          <button type="button" title="Sisipkan Gambar" className="p-2 rounded hover:bg-muted">
            <ImageIcon className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Gambar</DialogTitle>
            <DialogDescription>Masukkan URL gambar yang ingin disisipkan.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="https://example.com/image.png" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addImage()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageOpen(false)}>Batal</Button>
            <Button onClick={addImage}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isYoutubeOpen} onOpenChange={setIsYoutubeOpen}>
        <DialogTrigger asChild>
          <button type="button" title="Sisipkan Video YouTube" className="p-2 rounded hover:bg-muted text-red-500">
            <YoutubeIcon className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Video YouTube</DialogTitle>
            <DialogDescription>Masukkan link video YouTube yang valid.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="https://www.youtube.com/watch?v=..." 
              value={youtubeUrl} 
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addYoutubeVideo()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsYoutubeOpen(false)}>Batal</Button>
            <Button onClick={addYoutubeVideo}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogTrigger asChild>
          <button type="button" title="Sisipkan Link" className={cn("p-2 rounded hover:bg-muted", editor.isActive('link') ? 'bg-muted' : '')}>
            <LinkIcon className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sisipkan Link</DialogTitle>
            <DialogDescription>Masukkan URL link. (Contoh: https://google.com)</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="https://example.com" 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkOpen(false)}>Batal</Button>
            <Button onClick={setLink}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <button
        type="button"
        title="Hapus Link"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className="p-2 rounded hover:bg-muted disabled:opacity-50"
      >
        <Unlink className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border mx-1 self-center" />
      <button
        type="button"
        title="Sisipkan Flowchart (Mermaid)"
        onClick={() => editor.chain().focus().setCodeBlock({ language: 'mermaid' }).run()}
        className={cn("p-2 rounded hover:bg-muted text-primary", editor.isActive('codeBlock', { language: 'mermaid' }) ? 'bg-muted' : '')}
      >
        <Workflow className="h-4 w-4" />
      </button>

      <div className="flex-1" />
      <button
        type="button"
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-muted"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-muted"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
};

const extensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  MermaidCodeBlock,
  ImageResize,
  TextStyle,
  Color,
  Underline,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline cursor-pointer',
    },
  }),
  Youtube.configure({
    inline: false,
    HTMLAttributes: {
      class: 'w-full aspect-video rounded-md',
    },
  }),
];

export function RichTextEditor({ content, onChange, readOnly = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: readOnly 
          ? 'prose dark:prose-invert max-w-none w-full focus:outline-none'
          : 'prose dark:prose-invert max-w-none w-full min-h-[300px] p-4 border border-t-0 border-input bg-background rounded-b-md focus:outline-none',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        let imagePasted = false
        
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            imagePasted = true
            const file = item.getAsFile()
            if (file) {
              const reader = new FileReader()
              reader.onload = (e) => {
                if (e.target?.result) {
                  const src = e.target.result as string
                  const { schema } = view.state
                  const node = schema.nodes.imageResize.create({ src })
                  const transaction = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(transaction)
                }
              }
              reader.readAsDataURL(file)
            }
          }
        }
        
        return imagePasted
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          let imageDropped = false
          const files = Array.from(event.dataTransfer.files)
          
          for (const file of files) {
            if (file.type.indexOf('image') === 0) {
              imageDropped = true
              const reader = new FileReader()
              reader.onload = (e) => {
                if (e.target?.result) {
                  const src = e.target.result as string
                  const { schema } = view.state
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                  if (coordinates) {
                    const node = schema.nodes.imageResize.create({ src })
                    const transaction = view.state.tr.insert(coordinates.pos, node)
                    view.dispatch(transaction)
                  }
                }
              }
              reader.readAsDataURL(file)
            }
          }
          
          return imageDropped
        }
        return false
      }
    },
  });

  if (readOnly) {
    return <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />;
  }

  return (
    <div className="w-full flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
