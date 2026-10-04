import { test, expect, type Page } from '@playwright/test';

async function insertOutput(page: Page, text = 'Halo Dunia', index = 1) {
  await page.getByRole('button', { name: `Tambah langkah ${index}`, exact: true }).click();
  await page.getByRole('button', { name: /Tampilkan output Tampilkan pesan/ }).click();
  await page.getByLabel('Pesan yang ditampilkan').fill(text);
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
}
test('insert, edit, undo/redo, delete and recover draft', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.algorithm-node')).toHaveCount(2);
  await insertOutput(page);
  await expect(page.locator('.algorithm-node')).toHaveCount(3);
  await page.getByLabel('Pesan yang ditampilkan').fill('Selamat belajar');
  await page.getByRole('button', { name: 'Simpan instruksi' }).click();
  await expect(page.locator('.node-label', { hasText: 'Selamat belajar' })).toBeVisible();
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
  await expect(page.locator('.node-label', { hasText: 'Halo Dunia' })).toBeVisible();
  await page.getByRole('button', { name: 'Ulangi perubahan', exact: true }).click();
  await expect(page.getByRole('status', { name: '' }).filter({ hasText: 'Draft tersimpan' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.node-label', { hasText: 'Selamat belajar' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Urutan langkah' }).getByRole('button', { name: '“Selamat belajar”' }).click();
  await page.getByRole('button', { name: 'Hapus instruksi' }).click();
  await expect(page.locator('.algorithm-node')).toHaveCount(2);
  expect(errors).toEqual([]);
});
test('inserts on chosen edge and supports keyboard undo', async ({ page }) => {
  await page.goto('/');
  await insertOutput(page, 'Pertama');
  await insertOutput(page, 'Kedua', 2);
  await insertOutput(page, 'Tengah', 2);
  const outline = page.getByRole('navigation', { name: 'Urutan langkah' });
  await expect(outline.getByRole('button')).toHaveText(['MulaiSTART', '“Pertama”', '“Tengah”', '“Kedua”', 'SelesaiEND']);
  await page.getByRole('button', { name: 'Tutup panel' }).click();
  await page.keyboard.press('Control+z');
  await expect(page.locator('.algorithm-node')).toHaveCount(4);
  await page.keyboard.press('Control+Shift+z');
  await expect(page.locator('.algorithm-node')).toHaveCount(5);
});
test('validates variable names and records each instruction type', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tambah langkah 1', exact: true }).click();
  await page.getByRole('button', { name: /Deklarasikan variabel Siapkan/ }).click();
  await page.getByLabel('Nama variabel').fill('1nilai');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await expect(page.locator('.algorithm-node')).toHaveCount(2);
  await page.getByLabel('Nama variabel').fill('nilai');
  await page.getByLabel('Nilai awal').fill('0');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await expect(page.locator('.node-label', { hasText: 'nilai : Integer = 0' })).toBeVisible();
  await page.getByRole('button', { name: 'Tambah langkah 2', exact: true }).click();
  await page.getByRole('button', { name: /Masukkan data Minta/ }).click();
  await page.getByLabel('Simpan ke variabel').fill('nilai');
  await page.getByLabel('Pesan untuk pengguna').fill('Masukkan nilaimu');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah langkah 3', exact: true }).click();
  await page.getByRole('button', { name: /Ubah nilai Hitung/ }).click();
  await page.getByLabel('Simpan ke variabel').fill('nilai');
  await page.getByLabel('Nilai atau ekspresi').fill('nilai + 1');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await expect(page.locator('.algorithm-node')).toHaveCount(5);
});
test('exports a versioned document and rejects malformed import', async ({ page }) => {
  await page.goto('/');
  await insertOutput(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor JSON' }).click();
  const exported = await download;
  const stream = await exported.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const doc = JSON.parse(Buffer.concat(chunks).toString());
  expect(doc.schemaVersion).toBe(4);
  expect(doc.program.instructions[0].text).toBe('Halo Dunia');
  await page.getByLabel('Pilih file algoritma').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":999}') });
  await expect(page.getByText(/File tidak dapat dibuka/)).toBeVisible();
  await expect(page.locator('.algorithm-node')).toHaveCount(3);
  page.on('dialog', (dialog) => dialog.accept());
  doc.metadata.title = 'Hasil impor';
  await page.getByLabel('Pilih file algoritma').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await expect(page.getByLabel('Nama algoritma')).toHaveValue('Hasil impor');
});
test('preserves a damaged draft until the user recovers or resets it', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('flowlab.draft.v1', '{invalid'));
  await page.goto('/');
  await expect(page.getByRole('alert', { name: 'Status penyimpanan' })).toContainText('Draft tidak dapat dibuka');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('flowlab.draft.v1'))).toBe('{invalid');
  await page.getByRole('button', { name: 'Mulai ulang draft' }).click();
  await expect(page.getByText('Draft tersimpan', { exact: true })).toBeVisible();
});
test('notices changes from another tab and allows explicit reload', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('Draft tersimpan', { exact: true })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.getByText('Draft tersimpan', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert', { name: 'Status penyimpanan' })).toHaveCount(0);
  await insertOutput(other, 'Dari tab kedua');
  await expect(page.getByRole('alert', { name: 'Status penyimpanan' })).toContainText('Draft berubah di tab lain');
  await page.getByRole('button', { name: 'Muat versi terbaru' }).click();
  await expect(page.locator('.node-label', { hasText: 'Dari tab kedua' })).toBeVisible();
});
test('mobile editor fits viewport and can insert through its drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await insertOutput(page);
  await page.getByRole('button', { name: 'Tutup panel' }).click();
  await expect(page.locator('.node-label', { hasText: 'Halo Dunia' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('drag and arrange preserve program order and support undo', async ({ page }) => {
  await page.goto('/');
  await insertOutput(page);
  await page.getByRole('button', { name: 'Tutup panel' }).click();
  await expect(page.getByText('Draft tersimpan', { exact: true })).toBeVisible();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('flowlab.draft.v1')!));
  const node = page.locator('.react-flow__node').filter({ hasText: 'Halo Dunia' });
  const box = await node.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 70, box!.y + box!.height / 2 + 30, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('flowlab.draft.v1')!).layout)).not.toEqual(before.layout);
  const moved = await page.evaluate(() => JSON.parse(localStorage.getItem('flowlab.draft.v1')!));
  expect(moved.program).toEqual(before.program);
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('flowlab.draft.v1')!).layout)).toEqual(before.layout);
  await page.getByRole('button', { name: 'Ulangi perubahan', exact: true }).click();
  await page.getByRole('button', { name: 'Rapikan alur' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('flowlab.draft.v1')!).layout)).toEqual(before.layout);
});

test('storage errors remain visible while export remains available', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.goto('/');
  await expect(page.getByRole('alert', { name: 'Status penyimpanan' })).toContainText('Draft gagal disimpan');
  await insertOutput(page);
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor JSON' }).click();
  expect((await exported).suggestedFilename()).toContain('.flow.json');
});
