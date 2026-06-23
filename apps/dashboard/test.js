import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import { TextAlign } from '@tiptap/extension-text-align';

const editor = new Editor({
  extensions: [
    StarterKit, 
    ImageResize,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'image', 'imageResize'],
    })
  ],
  content: '<p>Test</p>',
});

editor.commands.setImage({ src: 'test.png' });
// Try applying center using the ImageResize specific command if it exists, or just manually set the node
// Wait, ImageResize has setTextAlign? No, it uses updateAttributes
editor.commands.updateAttributes('imageResize', { cssFloat: 'none', display: 'block' });
// Add style?
console.log("DEFAULT HTML:", editor.getHTML());

// Try setting align center via TextAlign extension
editor.chain().focus().setTextAlign('center').run();
console.log("AFTER TEXT ALIGN CENTER:", editor.getHTML());

// Simulate ImageResize center align
editor.commands.updateAttributes('imageResize', { style: 'display: block; margin-left: auto; margin-right: auto;' });
console.log("AFTER IMAGERESIZE STYLE:", editor.getHTML());
