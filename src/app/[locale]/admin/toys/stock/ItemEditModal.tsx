'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ImagePlus, Minus, Plus, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useToys } from '../useToys';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { AGE_BANDS } from '@/lib/toyBands';
import { TOY_LOCATIONS } from '@/lib/toyLocations';

export interface StockItem {
  id: string;
  title?: string;
  article?: string;
  description?: string;
  ageBand?: string;
  age?: number;
  ean?: string;
  quantity: number;
  location?: string;
  pictures?: string[];
  cover?: string | null;
}

export function ItemEditModal({
  item,
  onClose,
  onChanged,
  onDeleted,
}: {
  /** Null = create mode; an item = edit mode. */
  item: StockItem | null;
  onClose: () => void;
  onChanged: () => void;
  /** Called after the item was deleted (edit mode only). */
  onDeleted?: (id: string) => void;
}) {
  const t = useTranslations('admin.toys');
  const api = useToys();
  const creating = item === null;
  const [ean, setEan] = useState(item?.ean ?? '');
  const [title, setTitle] = useState(item?.title ?? item?.article ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [band, setBand] = useState(item?.ageBand ?? 'y5_7');
  const [qty, setQty] = useState(creating ? '4' : String(item?.quantity ?? 4));
  const [loc, setLoc] = useState(item?.location ?? 'warehouse');
  const [current, setCurrent] = useState<StockItem | null>(item);
  const [result, setResult] = useState<{ text: string; error?: boolean; id?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (creating && !current) {
      const r = await api.addItem(title, band, Number(qty), loc, description, ean);
      if (!r.success) return setResult({ text: t('inv.errorGuardar', { error: r.error }), error: true });
      const created = r.data as StockItem;
      // Pictures picked before saving are uploaded right after creation.
      if (pending.length > 0) {
        const up = await api.uploadPictures(created.id, pending.slice(0, 5));
        if (!up.success) {
          setCurrent(created);
          setResult({ text: t('inv.creadoSinFotos', { error: up.error }), error: true, id: created.id });
          onChanged();
          return;
        }
        setCurrent(up.data as StockItem);
        setPending([]);
      } else {
        setCurrent(created);
      }
      setResult({ text: t('inv.creado'), id: created.id });
      onChanged();
      return;
    }
    if (!current) return;
    const r = await api.updateItem(current.id, {
      // Only send the EAN when edited: demo seed EANs are not valid EAN-13 and would block every save.
      ...(ean !== (current.ean ?? '') ? { ean } : {}),
      title,
      description,
      ageBand: band,
      quantity: Number(qty),
      location: loc,
    });
    if (!r.success) return setResult({ text: t('inv.errorGuardar', { error: r.error }), error: true });
    setResult({ text: `${t('guardado')}: ${r.data.title}`, id: current.id });
    onChanged();
  };

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Before the item exists, hold the pictures and upload them on save.
    if (!current) {
      setPending(Array.from(files).slice(0, 5));
      return;
    }
    const r = await api.uploadPictures(current.id, files);
    if (!r.success) return setResult({ text: t('inv.errorFotos', { error: r.error }), error: true });
    setCurrent(r.data as StockItem);
    setResult({ text: `${t('fotos')}: ${(r.data.pictures as string[]).length}` });
    onChanged();
  };

  const runDelete = async () => {
    if (!current) return;
    const r = await api.deleteItem(current.id);
    setConfirmDelete(false);
    if (!r.success) return setResult({ text: t('inv.errorBorrar', { error: r.error }), error: true });
    onDeleted?.(current.id);
  };

  const pickCover = async (picture: string) => {
    if (!current) return;
    const r = await api.setCover(current.id, picture);
    if (!r.success) return setResult({ text: t('inv.errorFotos', { error: r.error }), error: true });
    setCurrent(r.data as StockItem);
    setResult({ text: t('inv.portadaCambiada') });
    onChanged();
  };

  const removePicture = async (picture: string) => {
    if (!current) return;
    const base = String(picture).split('/').pop() ?? picture;
    const r = await api.removePicture(current.id, base);
    if (!r.success) return setResult({ text: t('inv.errorFotos', { error: r.error }), error: true });
    setCurrent(r.data as StockItem);
    setResult({ text: t('inv.fotoQuitada') });
    onChanged();
  };

  const pictures = current?.pictures ?? [];
  const title0 = current?.title ?? current?.article ?? '';

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom]);

  const step = (delta: number) => setQty((q) => String(Math.max(0, (Number(q) || 0) + delta)));

  return (
    <>
      <Sheet open onOpenChange={(open) => { if (!open && zoom === null) onClose(); }}>
        <SheetContent
          side="right"
          data-testid="toys-edit-modal"
          aria-describedby={undefined}
          className="w-full gap-0 p-0 sm:max-w-xl [&>button.absolute]:hidden"
          onEscapeKeyDown={(e) => { if (zoom !== null) e.preventDefault(); }}
          onInteractOutside={(e) => { if (zoom !== null) e.preventDefault(); }}
        >
          <div className="flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <SheetDescription className="text-xs">{creating ? t('inv.nuevoJuguete') : t('inv.editarJuguete')}</SheetDescription>
              <SheetTitle className="font-heading text-xl font-bold">{creating ? t('inv.anadirJuguete') : title0}</SheetTitle>
            </div>
            <Button variant="outline" size="icon" className="size-11 shrink-0" aria-label={t('inv.cerrarPanel')} data-testid="toys-edit-close" onClick={onClose}>
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{t('fotosArchivo')}</span>
              <input
                ref={fileRef}
                data-testid="toys-edit-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={async (e) => {
                  const input = e.target;
                  await upload(input.files);
                  input.value = ''; // so picking the same photo again after an error fires onChange
                }}
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files); }}
                className={cn('flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed p-3', dragging ? 'border-primary bg-accent' : 'border-[#b9b7e6] bg-accent/60')}
              >
                {pictures.length > 0 && (
                  <ul data-testid="toys-edit-pics" className="flex flex-wrap gap-3">
                    {pictures.map((pic) => {
                      const base = String(pic).split('/').pop() ?? pic;
                      const isCover = current?.cover === pic;
                      return (
                        <li key={pic} className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            data-testid={`toys-thumb-${base}`}
                            onClick={() => setZoom(pictures.indexOf(pic))}
                            className={cn('relative size-20 cursor-zoom-in overflow-hidden rounded-lg border-2 bg-card p-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', isCover ? 'border-cta' : 'border-transparent')}
                            aria-label={t('inv.verFoto', { name: base })}
                          >
                            <img src={`${getApiBaseUrl()}${pic}`} alt="" className="h-full w-full object-cover" />
                            {isCover && <span className="absolute left-1 top-1 rounded-full bg-cta px-1.5 text-[10px] font-bold text-cta-foreground">{t('portada')}</span>}
                          </button>
                          <span className="flex items-center gap-1">
                            <label className="relative flex size-11 cursor-pointer items-center justify-center rounded-md hover:bg-card" title={t('inv.usarPortada')}>
                              <input
                                type="radio"
                                name={`cover-${current?.id ?? 'new'}`}
                                data-testid={`toys-edit-cover-${base}`}
                                checked={isCover}
                                onChange={() => pickCover(pic)}
                                className="peer sr-only"
                              />
                              <Star aria-hidden="true" className={cn('size-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary', isCover ? 'fill-cta text-[#a8833f]' : 'text-muted-foreground')} />
                              <span className="sr-only">{t('inv.usarPortada')}</span>
                            </label>
                            <Button
                              data-testid={`toys-edit-remove-${base}`}
                              variant="ghost"
                              size="icon"
                              className="size-11 text-destructive hover:text-destructive"
                              aria-label={t('quitarFoto')}
                              onClick={() => removePicture(pic)}
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Button
                  data-testid="toys-edit-upload-btn"
                  variant="outline"
                  className="h-20 min-w-36 flex-col gap-1 border-2 border-dashed bg-card text-primary"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus aria-hidden="true" className="size-5" />
                  {t('inv.subirOArrastrar')}
                </Button>
              </div>
              {creating && pending.length > 0 && (
                <span data-testid="toys-edit-pending" className="text-sm text-muted-foreground">
                  {t('fotos')}: {pending.length} · {t('inv.seSubenAlGuardar')}
                </span>
              )}
              <p className="text-xs text-muted-foreground">{t('inv.fotosAyuda')}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="toy-title" className="font-semibold">{t('inv.nombre')}</Label>
              <Input id="toy-title" data-testid="toys-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="toy-desc" className="font-semibold">{t('descripcion')} <span className="font-normal text-muted-foreground">({t('inv.opcional')})</span></Label>
              <Textarea id="toy-desc" data-testid="toys-edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-semibold">{t('inv.paraEdad')}</legend>
              <div data-testid="toys-edit-band" className="flex flex-wrap gap-2">
                {AGE_BANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    data-testid={`toys-edit-band-${b}`}
                    aria-pressed={band === b}
                    onClick={() => setBand(b)}
                    className={cn(
                      'min-h-11 rounded-full border px-3.5 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      band === b ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'bg-card hover:bg-accent',
                    )}
                  >
                    {t(`bandas.${b}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="toy-qty" className="font-semibold">{t('inv.unidades')}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-11" aria-label={t('inv.quitarUnaCorto')} onClick={() => step(-1)}><Minus aria-hidden="true" /></Button>
                  <Input id="toy-qty" data-testid="toys-edit-qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} className="h-11 w-20 text-center font-heading text-lg font-bold" />
                  <Button variant="outline" size="icon" className="size-11" aria-label={t('inv.anadirUnaCorto')} onClick={() => step(1)}><Plus aria-hidden="true" /></Button>
                </div>
              </div>
              <fieldset className="flex flex-col gap-1.5">
                <legend className="mb-1.5 text-sm font-semibold">{t('inv.dondeEsta')}</legend>
                <div data-testid="toys-edit-loc" role="radiogroup" className="flex flex-col gap-2">
                  {TOY_LOCATIONS.map((l) => (
                    <label
                      key={l}
                      className={cn(
                        'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                        loc === l ? 'border-2 border-primary bg-accent font-semibold' : 'bg-card',
                      )}
                    >
                      <input
                        type="radio"
                        name="toy-loc"
                        value={l}
                        data-testid={`toys-edit-loc-${l}`}
                        checked={loc === l}
                        onChange={() => setLoc(l)}
                        className="size-4 accent-[#3d3fa8]"
                      />
                      {t(`ubicaciones.${l}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="toy-ean" className="font-semibold">{t('inv.codigoBarras')} <span className="font-normal text-muted-foreground">({t('ean')})</span></Label>
              <Input id="toy-ean" data-testid="toys-edit-ean" value={ean} onChange={(e) => setEan(e.target.value)} className="h-11 font-mono" />
            </div>
            {result && (
              <p
                data-testid="toys-edit-result"
                data-item-id={result.id ?? current?.id ?? ''}
                role={result.error ? 'alert' : 'status'}
                className={cn('rounded-lg px-3 py-2 text-sm', result.error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}
              >
                {result.text}
              </p>
            )}
          </div>

          {confirmDelete && current && (
            <div data-testid="toys-delete-dialog" role="alertdialog" aria-labelledby="toy-del-title" className="flex flex-col gap-3 border-t border-destructive/30 bg-destructive/5 px-5 py-4 sm:px-6">
              <div>
                <p id="toy-del-title" className="font-semibold">{t('inv.borrarTitulo', { title: title0 })}</p>
                <p className="text-sm text-muted-foreground">{t('inv.borrarTexto')}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button data-testid="toys-delete-cancel" variant="outline" className="h-11" onClick={() => setConfirmDelete(false)}>{t('cancelar')}</Button>
                <Button data-testid="toys-delete-confirm" variant="destructive" className="h-11" onClick={runDelete}>{t('inv.borrarSi')}</Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3 sm:px-6">
            {!creating && current && (
              <Button data-testid="toys-edit-delete" variant="ghost" className="h-11 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden="true" />
                {t('eliminar')}
              </Button>
            )}
            <span className="flex-1" />
            <Button data-testid="toys-edit-cancel" variant="outline" className="h-11" onClick={onClose}>{t('cancelar')}</Button>
            <Button data-testid="toys-edit-save" className="h-11" onClick={save}>{creating && !current ? t('anadir') : t('guardarCambios')}</Button>
          </div>
        </SheetContent>
      </Sheet>


      {zoom !== null && pictures[zoom] && typeof document !== 'undefined' && createPortal(
        <div
          data-testid="toys-lightbox"
          className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          style={{ pointerEvents: 'auto' }}
          onClick={() => setZoom(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={String(pictures[zoom]).split('/').pop()}
            className="flex max-h-full w-full max-w-3xl flex-col gap-2 rounded-lg bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${getApiBaseUrl()}${pictures[zoom]}`}
              alt={String(pictures[zoom]).split('/').pop()}
              className="max-h-[70vh] w-full object-contain"
              data-testid="toys-lightbox-img"
            />
            <div className="flex items-center justify-between">
              <Button
                data-testid="toys-lightbox-prev"
                disabled={pictures.length < 2}
                onClick={() => setZoom((zoom - 1 + pictures.length) % pictures.length)}
              >
                ←
              </Button>
              <span data-testid="toys-lightbox-count">{zoom + 1} / {pictures.length}</span>
              <Button
                data-testid="toys-lightbox-next"
                disabled={pictures.length < 2}
                onClick={() => setZoom((zoom + 1) % pictures.length)}
              >
                →
              </Button>
            </div>
            <div className="flex justify-end">
              <Button data-testid="toys-lightbox-close" variant="outline" onClick={() => setZoom(null)}>{t('cerrar')}</Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
