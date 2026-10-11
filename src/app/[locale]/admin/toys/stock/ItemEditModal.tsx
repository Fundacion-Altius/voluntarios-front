'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
}: {
  /** Null = create mode; an item = edit mode. */
  item: StockItem | null;
  onClose: () => void;
  onChanged: () => void;
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
  const [result, setResult] = useState('');
  const [zoom, setZoom] = useState<number | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (creating) {
      const r = await api.addItem(title, band, Number(qty), loc, description, ean);
      if (!r.success) return setResult(`ERROR: ${r.error}`);
      const created = r.data as StockItem;
      // Pictures picked before saving are uploaded right after creation.
      if (pending.length > 0) {
        const up = await api.uploadPictures(created.id, pending.slice(0, 5));
        if (!up.success) {
          setCurrent(created);
          setResult(`ok: ${created.id} — ERROR: ${up.error}`);
          onChanged();
          return;
        }
        setCurrent(up.data as StockItem);
        setPending([]);
      } else {
        setCurrent(created);
      }
      setResult(`ok: ${created.id}`);
      onChanged();
      return;
    }
    if (!current) return;
    const r = await api.updateItem(current.id, {
      ean,
      title,
      description,
      ageBand: band,
      quantity: Number(qty),
      location: loc,
    });
    if (!r.success) return setResult(`ERROR: ${r.error}`);
    setResult(`${t('guardado')}: ${r.data.title}`);
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
    if (!r.success) return setResult(`ERROR: ${r.error}`);
    setCurrent(r.data as StockItem);
    setResult(`${t('fotos')}: ${(r.data.pictures as string[]).length}`);
    onChanged();
  };

  const pickCover = async (picture: string) => {
    if (!current) return;
    const r = await api.setCover(current.id, picture);
    if (!r.success) return setResult(`ERROR: ${r.error}`);
    setCurrent(r.data as StockItem);
    setResult(`${t('portada')}: ${r.data.cover}`);
    onChanged();
  };

  const removePicture = async (picture: string) => {
    if (!current) return;
    const base = String(picture).split('/').pop() ?? picture;
    const r = await api.removePicture(current.id, base);
    if (!r.success) return setResult(`ERROR: ${r.error}`);
    setCurrent(r.data as StockItem);
    setResult(`${t('quitarFoto')}: ${base}`);
    onChanged();
  };

  const pictures = current?.pictures ?? [];

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom]);

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent
          data-testid="toys-edit-modal"
          className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:max-w-2xl sm:p-6"
          onEscapeKeyDown={(e) => { if (zoom !== null) e.preventDefault(); }}
        >
        <DialogHeader className="text-left">
          <DialogTitle>{creating ? t('anadir') : `${t('editar')}: ${current?.title ?? current?.article}`}</DialogTitle>
          {!creating && <DialogDescription>{current?.ean ?? current?.id}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Label className="flex flex-col items-start gap-1">{t('ean')}
            <Input data-testid="toys-edit-ean" value={ean} onChange={(e) => setEan(e.target.value)} className="font-mono" />
          </Label>
          <Label className="flex flex-col items-start gap-1">{t('tituloItem')}
            <Input data-testid="toys-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Label>
          <Label className="col-span-1 flex flex-col items-start gap-1 sm:col-span-2">{t('descripcion')}
            <Textarea data-testid="toys-edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Label>
          <Label className="flex flex-col items-start gap-1">{t('edad')}
            <Select value={band} onValueChange={setBand}>
              <SelectTrigger data-testid="toys-edit-band" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGE_BANDS.map((b) => (
                  <SelectItem key={b} value={b}>{t(`bandas.${b}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="flex flex-col items-start gap-1">{t('ubicacion')}
            <Select value={loc} onValueChange={setLoc}>
              <SelectTrigger data-testid="toys-edit-loc" className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TOY_LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{t(`ubicaciones.${l}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="flex flex-col items-start gap-1">{t('cantidad')}
            <Input data-testid="toys-edit-qty" value={qty} onChange={(e) => setQty(e.target.value)} className="w-20" />
          </Label>
        </div>
        {(current || creating) && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t('fotosArchivo')}</span>
              <input
                ref={fileRef}
                data-testid="toys-edit-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => upload(e.target.files)}
              />
              <Button data-testid="toys-edit-upload-btn" variant="outline" className="w-44" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {t('subirFotos')}
              </Button>
              {creating && pending.length > 0 && (
                <span data-testid="toys-edit-pending" className="text-sm text-muted-foreground">
                  {t('fotos')}: {pending.length}
                </span>
              )}
            </div>
            {pictures.length > 0 && (
              <div data-testid="toys-edit-pics" className="flex flex-wrap items-center gap-2">
                {pictures.map((pic) => {
                  const base = String(pic).split('/').pop() ?? pic;
                  return (
                    <span key={pic} className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid={`toys-thumb-${base}`}
                        onClick={() => setZoom(pictures.indexOf(pic))}
                        className="cursor-zoom-in p-0"
                        aria-label={base}
                      >
                        <img src={`${getApiBaseUrl()}${pic}`} alt={base} className="h-10 w-10 object-cover" />
                      </button>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`cover-${current?.id ?? 'new'}`}
                          data-testid={`toys-edit-cover-${base}`}
                          checked={current?.cover === pic}
                          onChange={() => pickCover(pic)}
                        />
                        {t('portada')}
                      </label>
                      <Button data-testid={`toys-edit-remove-${base}`} onClick={() => removePicture(pic)}>
                        {t('quitarFoto')}
                      </Button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {result && <p data-testid="toys-edit-result">{result}</p>}
        <DialogFooter>
          <Button data-testid="toys-edit-cancel" variant="outline" onClick={onClose}>{t('cancelar')}</Button>
          <Button data-testid="toys-edit-save" onClick={save}>{creating ? t('anadir') : t('guardarCambios')}</Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

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
