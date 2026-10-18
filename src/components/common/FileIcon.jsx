import React from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  BookOpen,
  Image,
  File,
  FileCheck,
} from 'lucide-react';

export function FileIcon({ isDir, isOpen, extension, className = 'w-4 h-4' }) {
  if (isDir) {
    return isOpen ? (
      <FolderOpen className={`${className} text-amber-500 shrink-0`} />
    ) : (
      <Folder className={`${className} text-amber-500 shrink-0`} />
    );
  }

  const ext = (extension || '').toLowerCase();

  switch (ext) {
    case 'tex':
    case 'cls':
    case 'sty':
      return <FileCode className={`${className} text-emerald-500 shrink-0`} />;
    case 'bib':
      return <BookOpen className={`${className} text-amber-600 shrink-0`} />;
    case 'pdf':
      return <FileText className={`${className} text-rose-500 shrink-0`} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <Image className={`${className} text-sky-500 shrink-0`} />;
    case 'log':
    case 'aux':
    case 'toc':
    case 'out':
      return <FileCheck className={`${className} text-slate-400 shrink-0`} />;
    default:
      return <File className={`${className} text-slate-400 shrink-0`} />;
  }
}
