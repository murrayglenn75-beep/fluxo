import { afterEach, describe, expect, it, vi } from 'vitest';
import { readImageTextLocally } from './browser';

afterEach(() => vi.unstubAllGlobals());

const image = () => new File([new Uint8Array([1,2,3])], 'receipt.png', {type:'image/png'});

describe('on-device OCR adapter', () => {
  it('fails safely without native detector', async () => {
    vi.stubGlobal('TextDetector', undefined);
    await expect(readImageTextLocally(image())).rejects.toThrow('not supported');
  });
  it('rejects PDF input without scanning or upload', async () => {
    const pdf = new File(['sample'], 'test.pdf', {type:'application/pdf'});
    await expect(readImageTextLocally(pdf)).rejects.toThrow('invalid_image_input');
  });
  it('extracts local text and closes decoded image', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({width:100,height:100,close}));
    vi.stubGlobal('TextDetector', class {
      detect() { return Promise.resolve([{rawValue:'TOTAL R$ 12,90'},{rawValue:'20/10/2026'}]); }
    });
    expect(await readImageTextLocally(image())).toBe('TOTAL R$ 12,90\n20/10/2026');
    expect(close).toHaveBeenCalledOnce();
  });
  it('closes decoded image when detection fails', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({width:100,height:100,close}));
    vi.stubGlobal('TextDetector', class {
      detect() { return Promise.reject(new Error('device_error')); }
    });
    await expect(readImageTextLocally(image())).rejects.toThrow('device_error');
    expect(close).toHaveBeenCalledOnce();
  });
  it('denies oversized decoded image before OCR', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({width:10000,height:10000,close}));
    vi.stubGlobal('TextDetector', class {
      detect() { throw new Error('should_not_run'); }
    });
    await expect(readImageTextLocally(image())).rejects.toThrow('image_dimensions_out_of_range');
    expect(close).toHaveBeenCalledOnce();
  });
});
