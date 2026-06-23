const { Editor } = require('@tiptap/core');
const StarterKit = require('@tiptap/starter-kit');
const ImageResize = require('tiptap-extension-resize-image');

const editor = new Editor({
  extensions: [StarterKit, ImageResize],
  content: '<p>Test</p>',
});

// Insert image
editor.commands.setImage({ src: 'test.png' });

// We need to simulate the setAlign commands if they exist.
// Wait, imageResize might not have commands like setAlign.
// Let's check what nodes it registers.
console.log(editor.schema.nodes.imageResize);

