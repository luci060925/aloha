import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { uploadCatalogImage } from '../../lib/images';
import { slugify } from '../../lib/slug';
import {
  X,
  Sparkles, 
  Check, 
  Upload, 
  Trash2, 
  ArrowUp, 
  AlignCenter, 
  ArrowDown, 
  Layers,
  Tag,
  AlertCircle
} from 'lucide-react';

interface ImageItem {
  rawUrl: string;
  previewUrl: string;
  offsetYPercent: number; // 0 = Top, 50 = Center, 100 = Bottom
}

export const ProductFormModal: React.FC = () => {
  const {
    isProductModalOpen,
    editingProduct,
    closeProductModal,
    addProduct,
    updateProduct,
    categories,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [featured, setFeatured] = useState(false);
  const [category, setCategory] = useState('pantalones');
  const [subcategory, setSubcategory] = useState('sastreros');
  
  // Images with custom vertical alignment/framing
  const [imagesList, setImagesList] = useState<ImageItem[]>([]);

  // Sizes & Colors
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#000000');
  
  // Validation Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct && editingProduct.id) {
      setName(editingProduct.name || '');
      setDescription(editingProduct.description || '');
      setPrice(editingProduct.price ? String(editingProduct.price) : '');
      setOriginalPrice(editingProduct.originalPrice ? String(editingProduct.originalPrice) : '');
      setFeatured(Boolean(editingProduct.featured));
      setCategory(editingProduct.category || categories[0]?.slug || 'pantalones');
      setSubcategory(editingProduct.subcategory || '');
      
      if (editingProduct.images?.length) {
        setImagesList(editingProduct.images.map(img => ({
          rawUrl: img,
          previewUrl: img,
          offsetYPercent: 50
        })));
      } else {
        setImagesList([]);
      }

      setSizes(editingProduct.sizes?.length ? [...editingProduct.sizes] : []);
      setColors(editingProduct.colors?.length ? [...editingProduct.colors] : []);
    } else {
      // Clean blank state for new product; respeta la categoría/subcategoría preseleccionada al abrir el formulario
      setName('');
      setDescription('');
      setPrice('');
      setOriginalPrice('');
      setFeatured(false);
      setImagesList([]);
      setSizes([]);
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

  // Helper to render image into 3:4 canvas using specific vertical offset percentage (0 to 100%)
  const processImageTo3x4 = (srcUrl: string, offsetYPercent: number = 50): Promise<string> => {
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
          // Source is wider -> fit to height, center X
          renderHeight = targetHeight;
          renderWidth = img.width * (targetHeight / img.height);
          offsetX = (targetWidth - renderWidth) / 2;
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

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawResult = event.target?.result as string;
        if (rawResult) {
          const processed = await processImageTo3x4(rawResult, 50);
          setImagesList(prev => [
            ...prev,
            {
              rawUrl: rawResult,
              previewUrl: processed,
              offsetYPercent: 50
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateImageOffset = async (idx: number, newOffset: number) => {
    const item = imagesList[idx];
    if (!item) return;

    const reprocessed = await processImageTo3x4(item.rawUrl, newOffset);
    setImagesList(prev => prev.map((img, i) => 
      i === idx 
        ? { ...img, previewUrl: reprocessed, offsetYPercent: newOffset }
        : img
    ));
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
      return;
    }

    const cleanPrice = String(price).replace(/[^0-9]/g, '');
    const numericPrice = Number(cleanPrice);
    if (!cleanPrice || isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage('Por favor, ingresá un precio de venta válido (ej: 15900).');
      return;
    }

    if (!category) {
      setErrorMessage('Primero creá una categoría desde el panel de administración (Categorías & Subcategorías).');
      return;
    }

    if (imagesList.length === 0) {
      setErrorMessage('Por favor, adjuntá al menos una foto de la prenda.');
      return;
    }

    if (sizes.length === 0) {
      setErrorMessage('Por favor, seleccioná o agregá al menos un talle.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Las fotos nuevas (data URL) se suben a Storage; las ya subidas conservan su URL
      const finalImages = await Promise.all(
        imagesList.map(item =>
          item.previewUrl.startsWith('data:') ? uploadCatalogImage(item.previewUrl, 'products') : item.previewUrl
        )
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
        images: finalImages,
        sizes,
        colors: finalColors,
        featured,
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
      <div className="bg-[#121212] text-white max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl border border-neutral-800 rounded-2xl my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={closeProductModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white cursor-pointer rounded-full transition-colors hover:bg-neutral-800 border border-neutral-700/60"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

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

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-xs">
          
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

            <label className="flex items-start gap-3 p-3.5 bg-[#171717] border border-neutral-700 rounded-xl cursor-pointer hover:border-neutral-500 transition-colors">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-white cursor-pointer shrink-0"
              />
              <span>
                <span className="block uppercase tracking-wider font-semibold text-neutral-200">
                  Mostrar en Prendas Destacadas
                </span>
                <span className="block text-[11px] text-neutral-500 mt-0.5 normal-case">
                  Aparece en el carrusel "Prendas Destacadas" del inicio. Las prendas nuevas también entran solas en "Últimas Agregadas".
                </span>
              </span>
            </label>

            <div>
              <label className="block uppercase tracking-wider font-semibold text-neutral-300 mb-1.5">
                Descripción
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalle de tela, calce, caída, detalles de confección..."
                className="w-full px-3.5 py-2.5 bg-[#171717] border border-neutral-700 text-white rounded-xl focus:outline-none focus:border-white leading-relaxed resize-none placeholder:text-neutral-500 text-xs font-normal"
              />
            </div>
          </div>

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

            {/* Images List with Centering / Framing Tools */}
            {imagesList.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider font-semibold">
                  Ajustar encuadre de las fotos:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {imagesList.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex gap-3 p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl relative group items-center"
                    >
                      {/* 3:4 Thumbnail Preview */}
                      <div className="w-20 h-28 shrink-0 bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700 relative">
                        <img
                          src={item.previewUrl}
                          alt={`Prenda ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Framing and Alignment Controls */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white">
                            Foto #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                            title="Quitar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Centering / Position Selector */}
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">
                            Enfoque vertical:
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateImageOffset(idx, 0)}
                              className={`py-1 text-[10px] uppercase font-mono rounded cursor-pointer border flex items-center justify-center gap-1 transition-colors ${
                                item.offsetYPercent <= 15
                                  ? 'bg-white text-black border-white font-bold'
                                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                              }`}
                              title="Enfocar arriba (hombros / escote)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                              <span>Arriba</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateImageOffset(idx, 50)}
                              className={`py-1 text-[10px] uppercase font-mono rounded cursor-pointer border flex items-center justify-center gap-1 transition-colors ${
                                item.offsetYPercent > 15 && item.offsetYPercent < 85
                                  ? 'bg-white text-black border-white font-bold'
                                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                              }`}
                              title="Centrar foto"
                            >
                              <AlignCenter className="w-2.5 h-2.5" />
                              <span>Centro</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateImageOffset(idx, 100)}
                              className={`py-1 text-[10px] uppercase font-mono rounded cursor-pointer border flex items-center justify-center gap-1 transition-colors ${
                                item.offsetYPercent >= 85
                                  ? 'bg-white text-black border-white font-bold'
                                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                              }`}
                              title="Enfocar abajo (falda / ruedo)"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                              <span>Abajo</span>
                            </button>
                          </div>
                        </div>

                        {/* Slider for Fine-Tuning Centering */}
                        <div className="pt-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.offsetYPercent}
                            onChange={(e) => handleUpdateImageOffset(idx, Number(e.target.value))}
                            className="w-full accent-white cursor-pointer h-1 bg-neutral-800 rounded-lg"
                            title="Deslizar para encuadrar la prenda a gusto"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: TALLES (CON VISUALIZACIÓN INMEDIATA) */}
          <div className="space-y-4 p-5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-300 font-bold uppercase tracking-wider font-mono">
                <Layers className="w-4 h-4 text-white" />
                <span>3. Talles Seleccionados ({sizes.length})</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">Elegí o escribí los talles</span>
            </div>

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
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', 'Único'].map(sz => {
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

          {/* Bottom Validation Error Alert (if any) */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/90 border border-red-700 rounded-xl text-xs text-red-200 font-medium flex items-center gap-2.5 animate-fade-in shadow-md">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
