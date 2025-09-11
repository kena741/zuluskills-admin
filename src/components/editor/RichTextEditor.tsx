"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";

type Props = {
    value: string;
    onChange: (html: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
            }),
            Heading.configure({ levels: [2, 3] }),
            Underline,
            Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Placeholder.configure({ placeholder: "Start typing…" }),
        ],
        editorProps: {
            attributes: {
                class:
                    "min-h-[220px] px-3 py-3 outline-none focus:outline-none max-w-none bg-white text-gray-900 dark:bg-neutral-900 dark:text-neutral-100 leading-relaxed",
            },
        },
        content: value || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // Keep external value in sync if it changes (e.g., when editing an existing lesson)
    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        if ((value || "") !== current) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) return null;

    const promptLink = () => {
        const prev = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Enter URL", prev || "https://");
        if (url === null) return; // cancelled
        if (url === "") {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
        }
    };

    return (
        <div className="relative border rounded-lg bg-white dark:bg-neutral-900">
            <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1 text-sm bg-white dark:bg-neutral-900">
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive("bold") ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    B
                </button>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 italic text-gray-800 dark:text-neutral-100 ${editor.isActive("italic") ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    I
                </button>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 underline text-gray-800 dark:text-neutral-100 ${editor.isActive("underline") ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    U
                </button>
                <span className="mx-1 opacity-40">|</span>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive("bulletList") ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    • List
                </button>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive("orderedList") ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    1. List
                </button>
                <span className="mx-1 opacity-40">|</span>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive("heading", { level: 2 }) ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
                >
                    H2
                </button>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive("heading", { level: 3 }) ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
                >
                    H3
                </button>
                <span className="mx-1 opacity-40">|</span>
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100"
                    onClick={promptLink}
                >
                    Link
                </button>
                <span className="mx-1 opacity-40">|</span>
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100"
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    Undo
                </button>
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100"
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    Redo
                </button>
                <span className="mx-1 opacity-40">|</span>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive({ textAlign: "left" }) ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                >
                    Left
                </button>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive({ textAlign: "center" }) ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                >
                    Center
                </button>
                <button
                    type="button"
                    className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100 text-gray-800 dark:text-neutral-100 ${editor.isActive({ textAlign: "right" }) ? "bg-gray-100 dark:bg-neutral-800" : ""}`}
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                >
                    Right
                </button>
            </div>
            <div className="[&_strong]:font-semibold [&_strong]:text-inherit [&_em]:italic [&_em]:text-inherit [&_u]:underline [&_u]:text-inherit [&_h2]:text-inherit [&_h3]:text-inherit [&_a]:text-blue-600 dark:[&_a]:text-blue-400 hover:[&_a]:underline [&_a]:underline-offset-2">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
