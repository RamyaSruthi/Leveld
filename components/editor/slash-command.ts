/* eslint-disable @typescript-eslint/no-explicit-any */
import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy from "tippy.js";
import { SlashCommandList, type SlashCommandItem } from "./slash-command-list";

const COMMANDS: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain paragraph",
    icon: "¶",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: "H1",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "H2",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "H3",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: "•",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: "1.",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "To-do List",
    description: "Checkbox task list",
    icon: "☑",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Blockquote callout",
    icon: "❝",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    description: "Fenced code block",
    icon: "<>",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal separator",
    icon: "—",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    icon: "⊞",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
];

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) =>
          COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          ),
        render: () => {
          let component: ReactRenderer;
          let popup: any;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate: (props: any) => {
              component.updateProps(props);
              popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },

            onKeyDown: (props: any) => {
              if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
              }
              return (component.ref as any)?.onKeyDown(props);
            },

            onExit: () => {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
