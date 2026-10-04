import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { uploadCatalogImage } from '../../lib/images';
import { suggestDescriptions } from '../../lib/aiDescription';
import { LETTER_SIZES, NUMBER_SIZES, buildOneSize, isOneSizeList, oneSizeLabel, parseOneSize, validateOneSizeRange } from '../../lib/sizes';
import { slugify } from '../../lib/slug';
import {
  X,
  Sparkles,
  Check,
  Upload,
  Trash2,
  Move,
  Layers,
  Tag,
  AlertCircle
} from 'lucide-react';

interface ImageItem {
  rawUrl: string; // foto original (o la ya publicada)
  previewUrl: string;
  // Punto de la foto que queda en el centro del recuadro 3:4, en % (50 = centrada). Se cambia arrastrando la foto.
  offsetXPercent: number;
  offsetYPercent: number;
  ratio: number; // ancho / alto de la foto; 0.75 = ya es 3:4 y no hay nada que mover
}

const FRAME_RATIO = 0.75; // 3:4

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

/** Cuántos píxeles de la foto sobran (en vertical y en horizontal) al llenar un recuadro de ancho x alto. */
const overflowInBox = (ratio: number, boxW: number, boxH: number) => ({
  x: Math.max(0, boxH * ratio - boxW),
  y: Math.max(0, boxW / ratio - boxH),
});

/** Proporción (ancho / alto) de la foto, o null si el navegador no puede leerla (por ejemplo, fotos HEIC en Windows). */
const loadRatio = (src: string): Promise<number | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img.width && img.height ? img.width / img.height : FRAME_RATIO);
    img.onerror = () => resolve(null);
    img.src = src;
  });

export const ProductFormModal: React.FC = () => {
  const {
    isProductModalOpen,
    editingProduct,
    closeProductModal,
    addProduct,
    updateProduct,
    categories,
    products,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Arrastre de una foto dentro de su recuadro (posición inicial del gesto y tamaño del recuadro)
  const dragRef = useRef<{ idx: number; x: number; y: number; fx: number; fy: number; w: number; h: number } | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [category, setCategory] = useState('pantalones');
  const [subcategory, setSubcategory] = useState('sastreros');
  
  // Images with custom vertical alignment/framing
  const [imagesList, setImagesList] = useState<ImageItem[]>([]);

  // Sizes & Colors
  const [sizes, setSizes] = useState<string[]>([]);
  // Talle único: la prenda no se elige por talle, "calza del X al Y"
  const [oneSize, setOneSize] = useState(false);
  // Pestañas del formulario y tipo de la prenda (Mom, Oxford, Wide Leg...)
  type FormTab = 'datos' | 'imagenes' | 'variantes';
  const FORM_TABS: { id: FormTab; label: string; short: string }[] = [
    { id: 'datos', label: 'Datos de la prenda', short: 'Datos' },
    { id: 'imagenes', label: 'Imágenes cargadas', short: 'Imágenes' },
    { id: 'variantes', label: 'Talle, color y tipo', short: 'Talle y color' },
  ];
  const [tab, setTab] = useState<FormTab>('datos');
  const [productType, setProductType] = useState('');
  const goToTab = (next: FormTab) => {
    setTab(next);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [oneFrom, setOneFrom] = useState('');
  const [oneTo, setOneTo] = useState('');
  // Talles que realmente se guardan con la prenda
  const effectiveSizes = oneSize ? [buildOneSize(oneFrom, oneTo)] : sizes;
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#000000');
  
  // Validation Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sugerencias de descripción con IA (3 opciones: cercana, elegante y canchera)
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [aiNotes, setAiNotes] = useState('');
  const SUGGESTION_LABELS = ['Cercana', 'Elegante', 'Canchera'];

  const handleSuggest = async () => {
    setSuggestError(null);
    setSuggestions([]);
    if (!name.trim()) {
      setSuggestError('Escribí primero el nombre de la prenda para que la IA tenga de dónde partir.');
      return;
    }
    setSuggesting(true);
    try {
      const options = await suggestDescriptions({
        name: name.trim(),
        category: categories.find(c => c.slug === category)?.name || category,
        subcategory: [categories.find(c => c.slug === category)?.subcategories?.find(s => s.slug === subcategory)?.name || subcategory, productType.trim()].filter(Boolean).join(' · '),
        colors: colors.map(c => c.name),
        sizes: effectiveSizes.map(sz => (isOneSizeList([sz]) ? oneSizeLabel(sz) : sz)),
        notes: aiNotes,
        imageSrc: imagesList[0]?.rawUrl,
      });
      setSuggestions(options);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'No se pudieron generar sugerencias.');
    } finally {
      setSuggesting(false);
    }
  };

  useEffect(() => {
    if (editingProduct && editingProduct.id) {
      setName(editingProduct.name || '');
      setDescription(editingProduct.description || '');
      setPrice(editingProduct.price ? String(editingProduct.price) : '');
      setOriginalPrice(editingProduct.originalPrice ? String(editingProduct.originalPrice) : '');
      setProductType(editingProduct.productType || '');
      setTab('datos');
      setCategory(editingProduct.category || categories[0]?.slug || 'pantalones');
      setSubcategory(editingProduct.subcategory || '');
      
      if (editingProduct.images?.length) {
        setImagesList(editingProduct.images.map(img => ({
          rawUrl: img,
          previewUrl: img,
          offsetXPercent: 50,
          offsetYPercent: 50,
          ratio: FRAME_RATIO,
        })));
      } else {
        setImagesList([]);
      }

      setSizes(editingProduct.sizes?.length ? [...editingProduct.sizes] : []);
      const savedOneSize = editingProduct.sizes?.length === 1 ? parseOneSize(editingProduct.sizes[0]) : null;
      setOneSize(Boolean(savedOneSize));
      setOneFrom(savedOneSize?.from ?? '');
      setOneTo(savedOneSize?.to ?? '');
      setColors(editingProduct.colors?.length ? [...editingProduct.colors] : []);
    } else {
      // Clean blank state for new product; respeta la categoría/subcategoría preseleccionada al abrir el formulario
      setName('');
      setDescription('');
      setPrice('');
      setOriginalPrice('');
      setProductType('');
      setTab('datos');
      setImagesList([]);
      setSizes([]);
      setOneSize(false);
      setOneFrom('');
      setOneTo('');
      setColors([]);
      const realCategories = categories.filter(c => c.slug !== 'all');
      const preselected = realCategories.find(c => c.slug === editingProduct?.category);
      const chosenCat = preselected || realCategories[0];
      setCategory(chosenCat?.slug || '');
      const preselectedSub = chosenCat?.subcategories?.find(s => s.slug === editingProduct?.subcategory);
      setSubcategory(preselectedSub?.slug || chosenCat?.subcategories?.[0]?.slug || '');
      setErrorMessage(null);
    }
    // Se ejecuta solo al abrir/cambiar de prenda: no depende de `categories` para no borrar lo que se está escribiendo.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct, isProductModalOpen]);

  if (!isProductModalOpen) return null;

  const isEditing = Boolean(editingProduct && editingProduct.id);
  const selectedCatObj = categories.find(c => c.slug === category);
  const availableSubcategories = selectedCatObj?.subcategories || [];
  // Tipos que ya usan otras prendas de la misma categoría (sin repetir mayúsculas/minúsculas)
  const suggestedTypes = Array.from(
    new Map(
      products.flatMap(p => (p.category === category && p.productType ? [[p.productType.toLowerCase(), p.productType] as const] : []))
    ).values()
  ).sort((a, b) => a.localeCompare(b, 'es'));

  // Helper to render image into 3:4 canvas using specific vertical offset percentage (0 to 100%)
  const processImageTo3x4 = (srcUrl: string, offsetYPercent: number = 50, offsetXPercent: number = 50): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // permite reencuadrar fotos ya subidas (el bucket envía CORS)
      img.onload = () => {
       try {
        const targetWidth = 1200;
        const targetHeight = 1600; // 3:4 ratio
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(srcUrl);
          return;
        }

        ctx.fillStyle = '#101010';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const srcRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight; // 0.75

        let renderWidth = targetWidth;
        let renderHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (srcRatio > targetRatio) {
          // Source is wider -> fit to height, apply custom X offset (0% = left, 50% = center, 100% = right)
          renderHeight = targetHeight;
          renderWidth = img.width * (targetHeight / img.height);
          offsetX = -((renderWidth - targetWidth) * (clampPercent(offsetXPercent) / 100));
          offsetY = 0;
        } else {
          // Source is taller -> fit to width, apply custom Y offset (0% = top, 50% = center, 100% = bottom)
          renderWidth = targetWidth;
          renderHeight = img.height * (targetWidth / img.width);
          offsetX = 0;
          const maxExtraHeight = renderHeight - targetHeight;
          const factor = Math.min(100, Math.max(0, offsetYPercent)) / 100;
          offsetY = - (maxExtraHeight * factor);
        }

        ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
        resolve(canvas.toDataURL('image/webp', 0.82));
       } catch {
        resolve(srcUrl);
       }
      };
      img.onerror = () => resolve(srcUrl);
      img.src = srcUrl;
    });
  };

  // Las fotos se guardan enteras y el recorte 3:4 se hace al publicar, con el punto que se eligió arrastrando la foto
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawResult = event.target?.result as string;
        if (rawResult) {
          const ratio = await loadRatio(rawResult);
          if (ratio === null) {
            setErrorMessage(`No pudimos leer la foto "${file.name}". Si es una foto HEIC (de iPhone), subila desde el celular o convertila a JPG antes de adjuntarla.`);
            return;
          }
          setImagesList(prev => [
            ...prev,
            { rawUrl: rawResult, previewUrl: rawResult, offsetXPercent: 50, offsetYPercent: 50, ratio },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Arrastrar la foto dentro de su recuadro: la foto sigue al dedo o al mouse
  const handleFramePointerDown = (idx: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const item = imagesList[idx];
    if (!item) return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { idx, x: e.clientX, y: e.clientY, fx: item.offsetXPercent, fy: item.offsetYPercent, w: rect.width, h: rect.height };
  };

  const handleFramePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const item = drag ? imagesList[drag.idx] : undefined;
    if (!drag || !item) return;
    const extra = overflowInBox(item.ratio, drag.w, drag.h);
    const nextX = extra.x > 1 ? clampPercent(drag.fx - ((e.clientX - drag.x) / extra.x) * 100) : drag.fx;
    const nextY = extra.y > 1 ? clampPercent(drag.fy - ((e.clientY - drag.y) / extra.y) * 100) : drag.fy;
    setImagesList(prev => prev.map((img, i) => (i === drag.idx ? { ...img, offsetXPercent: nextX, offsetYPercent: nextY } : img)));
  };

  const handleFramePointerUp = () => {
    dragRef.current = null;
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Size Handlers
  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customSizeInput.trim().toUpperCase();
    if (!clean) return;
    if (!sizes.includes(clean)) {
      setSizes(prev => [...prev, clean]);
    }
    setCustomSizeInput('');
  };

  const handleToggleSize = (sizeVal: string) => {
    if (sizes.includes(sizeVal)) {
      setSizes(prev => prev.filter(s => s !== sizeVal));
    } else {
      setSizes(prev => [...prev, sizeVal]);
    }
  };

  const handleRemoveSize = (sizeVal: string) => {
    setSizes(prev => prev.filter(s => s !== sizeVal));
  };

  // Color Handlers
  const handleAddCustomColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = customColorName.trim();
    if (!cleanName) return;
    if (!colors.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setColors(prev => [...prev, { name: cleanName, hex: customColorHex }]);
    }
    setCustomColorName('');
  };

  const handleToggleColor = (col: { name: string; hex: string }) => {
    if (colors.some(c => c.name.toLowerCase() === col.name.toLowerCase())) {
      setColors(prev => prev.filter(c => c.name.toLowerCase() !== col.name.toLowerCase()));
    } else {
      setColors(prev => [...prev, col]);
    }
  };

  const handleRemoveColor = (colorName: string) => {
    setColors(prev => prev.filter(c => c.name.toLowerCase() !== colorName.toLowerCase()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!name.trim()) {
      setErrorMessage('Por favor, ingresá el nombre de la prenda.');
      goToTab('datos');
      return;
    }

    const cleanPrice = String(price).replace(/[^0-9]/g, '');
    const numericPrice = Number(cleanPrice);
    if (!cleanPrice || isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage('Por favor, ingresá un precio de venta válido (ej: 15900).');
      goToTab('datos');
      return;
    }

    if (!category) {
      setErrorMessage('Primero creá una categoría desde el panel de administración (Categorías & Subcategorías).');
      goToTab('datos');
      return;
    }

    if (imagesList.length === 0) {
      setErrorMessage('Por favor, adjuntá al menos una foto de la prenda.');
      goToTab('imagenes');
      return;
    }

    if (oneSize) {
      const rangeError = validateOneSizeRange(oneFrom, oneTo);
      if (rangeError) {
        setErrorMessage(rangeError);
        goToTab('variantes');
        return;
      }
    } else if (sizes.length === 0) {
      setErrorMessage('Por favor, seleccioná o agregá al menos un talle, o marcá "Talle único".');
      goToTab('variantes');
      return;
    }

    setIsSubmitting(true);

    try {
      // Las fotos nuevas (data URL) se suben a Storage; las ya subidas conservan su URL
      const finalImages = await Promise.all(
        imagesList.map(async item => {
          if (!item.rawUrl.startsWith('data:')) return item.previewUrl;
          const framed = await processImageTo3x4(item.rawUrl, item.offsetYPercent, item.offsetXPercent);
          return uploadCatalogImage(framed, 'products');
        })
      );
      const finalColors = colors.length > 0 ? colors : [{ name: 'Único', hex: '#111111' }];
      const slug = slugify(name);

      const cleanOriginalPrice = originalPrice ? String(originalPrice).replace(/[^0-9]/g, '') : '';
      const numericOriginalPrice = cleanOriginalPrice ? Number(cleanOriginalPrice) : undefined;

      const payload = {
        name: name.trim(),
        slug: slug || `prenda-${Date.now()}`,
        description: description.trim(),
        price: numericPrice,
        originalPrice: numericOriginalPrice && numericOriginalPrice > 0 ? numericOriginalPrice : undefined,
        category,
        subcategory,
        productType: productType.trim(),
        images: finalImages,
        sizes: effectiveSizes,
        colors: finalColors,
      };

      if (isEditing && editingProduct?.id) {
        // Al editar no se tocan stock ni "nuevo ingreso"
        await updateProduct(editingProduct.id, payload);
      } else {
        await addProduct({ ...payload, inStock: true, isNewArrival: true });
      }

      closeProductModal();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error && err.message ? `No se pudo guardar la prenda: ${err.message}` : 'Ocurrió un error al guardar la prenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#121212] text-white max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl border border-neutral-800 rounded-2xl my-auto max-h-full overflow-y-auto" ref={scrollRef}>
        
        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
              {isEditing ? 'Modificar Prenda' : 'Publicar Nueva Prenda'}
            </h3>
            <p className="text-xs text-neutral-400 font-medium">
              {isEditing 
                ? `Editando datos de "${editingProduct?.name}"` 
                : 'Completá los campos y adjuntá tus fotografías para publicar la prenda en el catálogo.'}
            </p>
          </div>
        </div>

        {/* Barra de pestañas */}
        <div className="sticky top-0 z-20 -mx-6 sm:-mx-8 px-6 sm:px-8 pt-3 pb-3 mt-5 bg-[#121212]/95 backdrop-blur border-b border-neutral-800 flex items-center gap-2">
          <div role="tablist" className="flex-1 grid grid-cols-3 gap-1.5 p-1 bg-black rounded-xl border border-neutral-800">
            {FORM_TABS.map(({ id, label, short }) => {
              const complete =
                id === 'datos' ? name.trim() !== '' && Number(String(price).replace(/[^0-9]/g, '')) > 0 && category !== ''
                : id === 'imagenes' ? imagesList.length > 0
                : oneSize ? validateOneSizeRange(oneFrom, oneTo) === null : sizes.length > 0;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => goToTab(id)}
                  className={`py-2.5 px-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase tracking-normal sm:tracking-wider leading-tight text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                    tab === id ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{label}</span>
                    {id === 'imagenes' && imagesList.length > 0 ? ` (${imagesList.length})` : ''}
                  </span>
                  {complete ? (
                    <Check className={`w-3.5 h-3.5 shrink-0 ${tab === id ? 'text-emerald-600' : 'text-emerald-400'}`} aria-label="Completo" />
                  ) : (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${tab === id ? 'bg-amber-500' : 'bg-amber-400/70'}`} title="Falta completar" />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={closeProductModal}
            className="shrink-0 p-2.5 text-neutral-300 hover:text-white cursor-pointer rounded-full transition-colors bg-neutral-900 hover:bg-neutral-800 border border-neutral-700"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6 text-xs">
          
          <div className={tab === 'datos' ? 'space-y-6' : 'hidden'}>
          {/* SECCIÓN 1: DETALLES PRINCIPALES */}
          <div className="space-y-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-inner">
            <div className="flex items-center gap-2 text-neutral-300 font-bold uppercase tracking-wider font-mono">
              <Tag className="w-4 h-4 text-white" />
              <span>1. Datos de la Prenda</span>
            </div>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                Nombre de la Prenda *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Top Halter Ribbed Noir, Vestido Gala Minimal..."
                className="w-full px-4 py-2.5 bg-[#171717] border border-neutral-700 text-white rounded-xl focus:outline-none focus:border-white font-medium text-sm placeholder:text-neutral-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                  Categoría Principal *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const catObj = categories.find(c => c.slug === newCat);
                    const firstSub = catObj?.subcategories?.[0]?.slug || '';
                    setCategory(newCat);
                    setSubcategory(firstSub);
                  }}
                  className="w-full px-3.5 py-2.5 border border-neutral-700 rounded-xl focus:outline-none focus:border-white font-semibold uppercase bg-[#171717] text-white cursor-pointer"
                >
                  {categories.filter(c => c.slug !== 'all').map(cat => (
                    <option key={cat.id} value={cat.slug} className="bg-neutral-900 text-white">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                  Subcategoría *
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-700 rounded-xl focus:outline-none focus:border-white font-semibold uppercase bg-[#171717] text-white cursor-pointer"
                >
                  {availableSubcategories.map(sub => (
                    <option key={sub.id} value={sub.slug} className="bg-neutral-900 text-white">{sub.name}</option>
                  ))}
                  {availableSubcategories.length === 0 && (
                    <option value="" className="bg-neutral-900 text-white">General</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                  Precio de Venta ($ ARS) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-mono text-neutral-400 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15900"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#171717] border border-neutral-700 text-white rounded-xl font-mono font-bold focus:outline-none focus:border-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                  Precio Original / Tachado
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-mono text-neutral-400 text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Opcional (ej: 18500)"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#171717] border border-neutral-700 text-white rounded-xl font-mono focus:outline-none focus:border-white text-sm placeholder:text-neutral-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block uppercase tracking-wider font-semibold text-neutral-300">
                  Descripción
                </label>
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={suggesting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-600 text-[11px] font-mono font-bold uppercase text-neutral-200 hover:bg-white hover:text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  title="La IA propone 3 descripciones para elegir"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{suggesting ? 'Pensando…' : 'Sugerir con IA'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalle de tela, calce, caída, detalles de confección..."
                className="w-full px-3.5 py-2.5 bg-[#171717] border border-neutral-700 text-white rounded-xl focus:outline-none focus:border-white leading-relaxed resize-none placeholder:text-neutral-500 text-xs font-normal"
              />
              <input
                type="text"
                value={aiNotes}
                maxLength={300}
                onChange={(e) => setAiNotes(e.target.value)}
                placeholder="Para la IA (opcional): tela suave, bretel regulable, cierre atrás..."
                className="mt-2 w-full px-3.5 py-2 bg-[#171717] border border-neutral-800 text-white rounded-xl focus:outline-none focus:border-white placeholder:text-neutral-600 text-xs font-normal"
              />
              {suggestError && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{suggestError}</p>}
              {suggestions.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  <p className="text-[11px] text-neutral-400 font-medium normal-case">
                    Tocá la que más te guste para usarla. Después podés editarla. Revisá que sea correcta antes de guardar: la IA puede equivocarse.
                  </p>
                  {suggestions.map((text, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDescription(text);
                        setSuggestions([]);
                      }}
                      className="w-full text-left p-3 rounded-xl border border-neutral-700 bg-[#171717] hover:border-white transition-colors cursor-pointer"
                    >
                      <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        {SUGGESTION_LABELS[i] ?? `Opción ${i + 1}`}
                      </span>
                      <span className="block text-xs font-normal normal-case text-neutral-200 leading-relaxed">{text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          </div>

          <div className={tab === 'imagenes' ? 'space-y-6' : 'hidden'}>
          {/* SECCIÓN 2: FOTOGRAFÍAS Y ENCUADRE DINÁMICO */}
          <div className="space-y-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-300 font-bold uppercase tracking-wider font-mono">
                <Upload className="w-4 h-4 text-white" />
                <span>2. Fotografías de la Prenda ({imagesList.length})</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">Formato 3:4 automático</span>
            </div>

            {/* Upload Drag & Drop Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-neutral-700 hover:border-white bg-[#151515] hover:bg-[#1a1a1a] rounded-xl cursor-pointer flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-white flex items-center justify-center mb-2.5 transition-colors shadow-sm">
                <Upload className="w-5 h-5 text-neutral-300 group-hover:text-black transition-colors" />
              </div>
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                {imagesList.length === 0 ? 'Adjuntar Fotos de la Prenda' : '+ Agregar Más Fotos'}
              </span>
              <span className="text-[11px] text-neutral-400 mt-1">
                Tocá aquí para elegir imágenes desde tu celular o computadora (.jpg, .png, .webp)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Fotos: se acomodan arrastrándolas dentro de su recuadro */}
            {imagesList.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider font-semibold">
                  Así se verá cada foto. Arrastrala para acomodarla:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagesList.map((item, idx) => {
                    const movable = Math.abs(item.ratio - FRAME_RATIO) > 0.01;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div
                          onPointerDown={handleFramePointerDown(idx)}
                          onPointerMove={handleFramePointerMove}
                          onPointerUp={handleFramePointerUp}
                          onPointerCancel={handleFramePointerUp}
                          style={{ touchAction: movable ? 'none' : 'auto' }}
                          className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 select-none ${movable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        >
                          <img
                            src={item.previewUrl}
                            alt={`Prenda ${idx + 1}`}
                            draggable={false}
                            className="w-full h-full object-cover pointer-events-none"
                            style={{ objectPosition: `${item.offsetXPercent}% ${item.offsetYPercent}%` }}
                          />
                          {movable && (
                            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono uppercase text-white pointer-events-none">
                              <Move className="w-3 h-3" /> Arrastrá
                            </span>
                          )}
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/70 text-neutral-300 hover:text-red-400 transition-colors cursor-pointer"
                            title="Quitar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="block text-[10px] font-mono text-neutral-400">
                          Foto #{idx + 1}{movable ? '' : ' · ya entra completa'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          </div>

          <div className={tab === 'variantes' ? 'space-y-6' : 'hidden'}>
          {/* SECCIÓN 3: TALLES (CON VISUALIZACIÓN INMEDIATA) */}
          <div className="space-y-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-300 font-bold uppercase tracking-wider font-mono">
                <Layers className="w-4 h-4 text-white" />
                <span>3. Talles {oneSize ? '(talle único)' : `Seleccionados (${sizes.length})`}</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                {oneSize ? 'La clienta no elige talle' : 'Elegí o escribí los talles'}
              </span>
            </div>

            {/* Talle único: la clienta no elige, solo ve en qué talles calza */}
            <label className="flex items-start gap-3 p-3.5 bg-[#171717] border border-neutral-700 rounded-xl cursor-pointer hover:border-neutral-500 transition-colors">
              <input
                type="checkbox"
                checked={oneSize}
                onChange={(e) => setOneSize(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-white cursor-pointer shrink-0"
              />
              <span>
                <span className="block uppercase tracking-wider font-semibold text-neutral-200">Talle único</span>
                <span className="block text-[11px] text-neutral-500 mt-0.5 normal-case">
                  Para prendas que no se eligen por talle. La clienta ve un aviso con el rango en el que calza, sin botones de talle.
                </span>
              </span>
            </label>

            {oneSize ? (
              <div className="space-y-2 p-3.5 bg-black/70 border border-neutral-800 rounded-xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                  <span className="font-semibold">Calza del</span>
                  <select
                    value={oneFrom}
                    onChange={(e) => setOneFrom(e.target.value)}
                    className="px-3 py-2 bg-[#171717] border border-neutral-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="">--</option>
                    <optgroup label="Letras">
                      {LETTER_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </optgroup>
                    <optgroup label="Números">
                      {NUMBER_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </optgroup>
                  </select>
                  <span className="font-semibold">al</span>
                  <select
                    value={oneTo}
                    onChange={(e) => setOneTo(e.target.value)}
                    className="px-3 py-2 bg-[#171717] border border-neutral-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="">--</option>
                    <optgroup label="Letras">
                      {LETTER_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </optgroup>
                    <optgroup label="Números">
                      {NUMBER_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </optgroup>
                  </select>
                </div>
                <p className="text-[11px] text-neutral-400 normal-case">
                  Así lo verá la clienta: <strong className="text-white">{oneSizeLabel(buildOneSize(oneFrom, oneTo))}</strong>
                </p>
                {validateOneSizeRange(oneFrom, oneTo) && (
                  <p className="text-[11px] text-red-400 normal-case">{validateOneSizeRange(oneFrom, oneTo)}</p>
                )}
              </div>
            ) : (
              <>
                {/* Current Active Tags Display */}
                {sizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-black/70 border border-neutral-800 rounded-xl">
                    {sizes.map(sz => (
                      <span
                        key={sz}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-mono font-bold text-xs rounded-lg shadow-sm animate-fade-in"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(sz)}
                          className="hover:text-red-600 font-bold cursor-pointer text-xs ml-0.5"
                          title={`Quitar talle ${sz}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-black/40 border border-dashed border-neutral-800 rounded-xl text-neutral-500 italic text-xs">
                    Aún no agregaste ningún talle. Seleccioná abajo o escribí un talle nuevo.
                  </div>
                )}

                {/* Quick Preset Buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                    Tocar para agregar/quitar rápidamente:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44'].map(sz => {
                      const isActive = sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`min-w-[42px] h-9 px-3 font-mono text-xs uppercase tracking-wider border rounded-xl font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-white text-black border-white shadow-md scale-105'
                              : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Free Text Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    placeholder="Otro talle (ej. 1, 2, 46)..."
                    className="flex-1 px-3.5 py-2 bg-[#171717] border border-neutral-700 text-white rounded-xl font-mono text-xs focus:outline-none focus:border-white uppercase font-bold placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomSize()}
                    className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider rounded-xl text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    + Agregar
                  </button>
                </div>
              </>
            )}
          </div>

          {/* SECCIÓN 4: COLORES (CON VISUALIZACIÓN INMEDIATA) */}
          <div className="space-y-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-300 font-bold uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4 text-white" />
                <span>4. Colores Seleccionados ({colors.length})</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">Opcional</span>
            </div>

            {/* Current Active Colors Display */}
            {colors.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-black/70 border border-neutral-800 rounded-xl">
                {colors.map(col => (
                  <span
                    key={col.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-white font-semibold text-xs rounded-lg shadow-sm animate-fade-in"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-neutral-600 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(col.name)}
                      className="hover:text-red-400 font-bold cursor-pointer text-xs ml-0.5"
                      title={`Quitar color ${col.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-black/40 border border-dashed border-neutral-800 rounded-xl text-neutral-500 italic text-xs">
                Sin colores específicos (se asignará como color único si no seleccionás).
              </div>
            )}

            {/* Suggested Palette */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                Colores frecuentes (tocá para agregar/quitar):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Negro', hex: '#0a0a0a' },
                  { name: 'Blanco', hex: '#ffffff' },
                  { name: 'Beige', hex: '#e5dec9' },
                  { name: 'Camel', hex: '#c19a6b' },
                  { name: 'Chocolate', hex: '#4b3621' },
                  { name: 'Gris', hex: '#6b7280' },
                  { name: 'Rojo', hex: '#991b1b' },
                  { name: 'Verde Oliva', hex: '#3f4f2c' },
                ].map(col => {
                  const isActive = colors.some(c => c.name.toLowerCase() === col.name.toLowerCase());
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => handleToggleColor(col)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isActive
                          ? 'bg-neutral-800 border-white text-white ring-1 ring-white/50 shadow-md'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-neutral-600 shadow-xs"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Creator */}
            <div className="flex gap-2 items-center pt-1">
              <input
                type="text"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomColor();
                  }
                }}
                placeholder="Nombre de color nuevo (ej. Terracota, Lavanda)..."
                className="flex-1 px-3.5 py-2 bg-[#171717] border border-neutral-700 text-white rounded-xl text-xs focus:outline-none focus:border-white placeholder:text-neutral-500"
              />
              <div className="flex items-center gap-1 bg-[#171717] border border-neutral-700 rounded-xl px-2 py-1.5">
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded-lg"
                  title="Elegir tono"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddCustomColor()}
                className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider rounded-xl text-xs cursor-pointer transition-colors shadow-sm"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* SECCIÓN 5: TIPO DE PRENDA (uno solo) */}
          <div className="space-y-3 p-5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-300 font-bold uppercase tracking-wider font-mono">
                <Tag className="w-4 h-4 text-white" />
                <span>5. Tipo de Prenda</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">Opcional · uno solo</span>
            </div>

            <input
              type="text"
              list="tipos-de-prenda"
              value={productType}
              maxLength={40}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="Ej: Mom, Oxford, Wide Leg, Recto..."
              className="w-full px-3.5 py-2.5 bg-[#171717] border border-neutral-700 text-white rounded-xl focus:outline-none focus:border-white font-semibold text-sm placeholder:text-neutral-500"
            />
            <datalist id="tipos-de-prenda">
              {suggestedTypes.map(type => <option key={type} value={type} />)}
            </datalist>

            {suggestedTypes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-neutral-400 uppercase font-mono">Ya usados en esta categoría:</span>
                {suggestedTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProductType(type)}
                    className={`px-3 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                      productType.trim().toLowerCase() === type.toLowerCase()
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-neutral-500 normal-case">
              Si una clienta busca este nombre en la tienda, la prenda aparece. Escribilo siempre igual (por ejemplo "Wide Leg") para que se agrupen.
            </p>
          </div>
          </div>

          {/* Bottom Validation Error Alert (if any) */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/90 border border-red-700 rounded-xl text-xs text-red-200 font-medium flex items-center gap-2.5 animate-fade-in shadow-md">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Navegación entre pestañas */}
          <div className="flex items-center justify-between gap-3">
            {tab !== 'datos' ? (
              <button
                type="button"
                onClick={() => goToTab(tab === 'variantes' ? 'imagenes' : 'datos')}
                className="px-4 py-2.5 border border-neutral-700 text-neutral-300 font-bold uppercase tracking-wider hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer rounded-xl"
              >
                ← Atrás
              </button>
            ) : <span />}
            {tab !== 'variantes' && (
              <button
                type="button"
                onClick={() => goToTab(tab === 'datos' ? 'imagenes' : 'variantes')}
                className="px-4 py-2.5 border border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors cursor-pointer rounded-xl"
              >
                Siguiente →
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={closeProductModal}
              className="w-1/3 py-3.5 border border-neutral-700 text-neutral-300 font-bold uppercase tracking-wider hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-white text-black font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all cursor-pointer rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Publicar Prenda'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
