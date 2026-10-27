"use client";

import { useEffect, useRef } from "react";
import type { ArchiveItem } from "@/lib/gallery";
import { GalleryImage } from "./GalleryImage";

export default function ArtifactViewer({
  item,
  sequence,
  brand,
  onClose,
  onNavigate,
}: {
  item: ArchiveItem;
  sequence: ArchiveItem[];
  brand: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const actions = useRef({ onClose, onNavigate, sequence, item });
  useEffect(() => {
    actions.current = { onClose, onNavigate, sequence, item };
  }, [onClose, onNavigate, sequence, item]);
  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    modal.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      modal.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  useEffect(() => {
    content.current?.scrollTo(0, 0);
  }, [item.id]);
  const step = (direction: number) => {
    const { sequence, item, onNavigate } = actions.current;
    if (sequence.length > 1)
      onNavigate(
        sequence[
          (sequence.findIndex((entry) => entry.id === item.id) +
            direction +
            sequence.length) %
            sequence.length
        ].id,
      );
  };
  return (
    <dialog
      ref={dialog}
      className="artifact-viewer"
      aria-labelledby="artifact-title"
      aria-describedby="artifact-shortcuts"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          step(event.key === "ArrowLeft" ? -1 : 1);
        }
        if (event.key === "Tab") {
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), a[href]",
            ),
          ).filter((element) => element.getClientRects().length);
          const first = controls[0],
            last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <header className="artifact-toolbar">
        <span className="label">
          {brand} / ARTIFACT {item.number}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close artifact viewer"
        >
          CLOSE <span aria-hidden="true">↗</span>
        </button>
      </header>
      <div ref={content} className="artifact-content" tabIndex={-1}>
        <div className="artifact-heading">
          <p className="label">
            {item.type}
            {item.date ? ` / ${item.date}` : ""}
          </p>
          <h2 id="artifact-title">{item.title}</h2>
          {item.projectTitle && <p>{item.projectTitle}</p>}
        </div>
        <GalleryImage
          key={item.id}
          src={item.image}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(min-width: 1440px) 1200px, 94vw"
        />
        <div className="artifact-notes">
          {item.caption?.trim() && <p>{item.caption}</p>}
          {item.tags.length > 0 && (
            <ul aria-label="Tags" className="archive-tags">
              {item.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
          <nav aria-label="Artifact links">
            {item.projectHref && (
              <a href={item.projectHref}>Project case study ↗</a>
            )}
            {item.githubHref && <a href={item.githubHref}>GitHub ↗</a>}
            {item.links?.external && (
              <a href={item.links.external}>External link ↗</a>
            )}
          </nav>
        </div>
        <footer className="artifact-navigation">
          <button
            type="button"
            disabled={sequence.length < 2}
            onClick={() => step(-1)}
          >
            ← PREVIOUS
          </button>
          <p id="artifact-shortcuts" className="label">
            ← → browse / Esc close
          </p>
          <button
            type="button"
            disabled={sequence.length < 2}
            onClick={() => step(1)}
          >
            NEXT →
          </button>
        </footer>
      </div>
    </dialog>
  );
}
