import { test, expect, type Page } from '@playwright/test';
import { programFixture, type SourceInstruction } from '../packages/interpreter/src/fixtures';

const declare = (name: string, initialValue = ''): SourceInstruction => ({ kind: 'declaration', name, dataType: 'Integer', initialValue });
const output = (text: string): SourceInstruction => ({ kind: 'output', mode: 'expression', text });
const whileLoop = (condition: string, body: SourceInstruction[] = []): SourceInstruction => ({ kind: 'while', condition, body });
const forLoop = (body: SourceInstruction[] = [], step = '1'): SourceInstruction => ({ kind: 'for', counter: 'i', from: '1', to: '3', step, body });
const outline = (page: Page) => page.getByRole('navigation', { name: 'Urutan langkah' });
async function load(page: Page, source: SourceInstruction[]) {
  const doc = programFixture(source);
  await page.goto('/');
  await page.getByLabel('Pilih file algoritma').setInputFiles({ name: 'loops.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await expect(page.getByText('Algoritma berhasil diimpor.', { exact: true })).toBeVisible();
  return doc;
}
async function addOutput(page: Page, expression: string) {
  await page.getByRole('button', { name: /Tampilkan output Tampilkan pesan/ }).click();
  await page.getByLabel('Jenis output').selectOption('expression');
  await page.getByLabel('Ekspresi output').fill(expression);
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
}

test('build for through forms, run 1–10 and countdown, export and recover its body', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Tambah langkah 1', exact: true }).click();
  await page.getByRole('button', { name: /Deklarasikan variabel Siapkan/ }).click();
  await page.getByLabel('Nama variabel').fill('i');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah langkah 2', exact: true }).click();
  await page.getByRole('button', { name: /Ulangi dengan penghitung Hitung/ }).click();
  await page.getByLabel('Variabel penghitung').fill('i');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah di dalam perulangan', exact: true }).click();
  await addOutput(page, 'i');
  await outline(page).getByRole('button', { name: 'FOR i: 1 → 10 (1)', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah setelah perulangan' }).click();
  await addOutput(page, '"Selesai loop"');
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText([...Array.from({ length: 10 }, (_, i) => String(i + 1)), 'Selesai loop']);
  await expect(page.locator('.loop-back-edge.flow-traversed')).toHaveCount(1);
  await expect(page.locator('.loop-exit-label.is-executed')).toHaveText('✓ Selesai');
  await page.getByRole('button', { name: 'Lihat seluruh alur', exact: true }).first().click();
  await page.screenshot({ path: testInfo.outputPath('for-desktop.png') });
  await outline(page).getByRole('button', { name: 'FOR i: 1 → 10 (1)', exact: true }).click();
  await page.getByLabel('Mulai dari').fill('5');
  await page.getByLabel('Sampai (inklusif)').fill('1');
  await page.getByLabel('Perubahan tiap putaran').fill('-2');
  await page.getByRole('button', { name: 'Simpan instruksi' }).click();
  await expect(page.locator('.flow-traversed')).toHaveCount(0);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['5', '3', '1', 'Selesai loop']);
  await expect(page.getByText('Draft tersimpan', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor JSON' }).click();
  const stream = await (await download).createReadStream(), chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.schemaVersion).toBe(4);
  expect(exported.program.instructions[1]).toMatchObject({ kind: 'for', step: '-2', body: [{ kind: 'output', text: 'i' }] });
  expect(exported).not.toHaveProperty('visitedNodeIds');
  await page.reload();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['5', '3', '1', 'Selesai loop']);
  expect(errors).toEqual([]);
});

test('while body insertion through the back edge, subtree delete and undo preserve structure', async ({ page }) => {
  await load(page, [declare('i', '1'), whileLoop('i <= 3')]);
  await page.getByRole('button', { name: /^Tambah di dalam perulangan \d+$/ }).click();
  await addOutput(page, 'i');
  await page.getByRole('button', { name: /^Tambah langkah sebelum mengulang/ }).click();
  await page.getByRole('button', { name: /Ubah nilai Hitung/ }).click();
  await page.getByLabel('Simpan ke variabel').fill('i');
  await page.getByLabel('Nilai atau ekspresi').fill('i + 1');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['1', '2', '3']);
  await outline(page).getByRole('button', { name: 'WHILE i <= 3', exact: true }).click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Hapus instruksi' }).click();
  await expect(page.locator('.loop-back-edge')).toHaveCount(1);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Hapus instruksi' }).click();
  await expect(page.locator('.loop-back-edge')).toHaveCount(0);
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['1', '2', '3']);
});

test('nested loops accept repeated input at the same node without retaining the previous answer', async ({ page }) => {
  const nested: SourceInstruction = { kind: 'for', counter: 'j', from: '1', to: '2', step: '1', body: [{ kind: 'input', target: 'x', prompt: 'Masukkan angka' }, output('x')] };
  await load(page, [declare('i'), declare('j'), declare('x'), { ...forLoop([nested]), to: '2' } as SourceInstruction]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  for (const value of ['10', '20', '30', '40']) {
    const input = page.getByLabel('Nilai masukan', { exact: true });
    await expect(input).toHaveValue('');
    await input.fill(value);
    await page.getByRole('button', { name: 'Kirim masukan' }).click();
    await expect(page.locator('.output-line pre').last()).toHaveText(value);
  }
  await expect(page.getByText('Program selesai', { exact: true })).toBeVisible();
  await expect(page.locator('.output-line pre')).toHaveText(['10', '20', '30', '40']);
  await expect(page.locator('.loop-back-edge.flow-traversed')).toHaveCount(2);
});

test('zero step reports its source and can be repaired; counter writes are diagnosed', async ({ page }) => {
  await load(page, [declare('i'), forLoop([output('i')], '0')]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await page.getByRole('button', { name: /Perubahan tiap putaran tidak boleh 0/ }).click();
  await expect(page.getByLabel('Perubahan tiap putaran')).toHaveValue('0');
  await page.getByLabel('Perubahan tiap putaran').fill('1');
  await page.getByRole('button', { name: 'Simpan instruksi' }).click();
  await page.getByRole('button', { name: 'Tambah di dalam perulangan', exact: true }).click();
  await page.getByRole('button', { name: /Ubah nilai Hitung/ }).click();
  await page.getByLabel('Simpan ke variabel').fill('i');
  await page.getByLabel('Nilai atau ekspresi').fill('i + 1');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await page.getByRole('button', { name: /Counter for "i" diperbarui otomatis/ }).click();
  await expect(page.getByLabel('Nilai atau ekspresi')).toHaveValue('i + 1');
});

test('empty infinite while remains stoppable and Reset clears its trace', async ({ page }) => {
  await load(page, [whileLoop('true')]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.loop-back-edge.flow-traversed')).toHaveCount(1);
  await page.getByRole('button', { name: 'Hentikan', exact: true }).click();
  await expect(page.getByText('Program dihentikan', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset eksekusi' }).click();
  await expect(page.locator('.flow-traversed')).toHaveCount(0);
  await expect(page.getByText('Siap dijalankan', { exact: true })).toBeVisible();
});

test('infinite while stops automatically at the default step limit', async ({ page }) => {
  test.setTimeout(90000);
  await load(page, [whileLoop('true')]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.getByRole('button', { name: /Program dihentikan setelah batas 100000 langkah/ })).toBeVisible({ timeout: 80000 });
  await expect(page.getByText('Periksa masalah', { exact: true })).toBeVisible();
  // Highlight of the entry survives truncation of the event ring.
  await expect(page.locator('.terminator[data-executed=true]')).toHaveCount(1);
});

test('mobile can edit a loop body and run it without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, [declare('i'), forLoop()]);
  await page.getByRole('button', { name: 'Buka panduan' }).click();
  await outline(page).getByRole('button', { name: 'FOR i: 1 → 3 (1)', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Tambah di dalam perulangan', exact: true }).click();
  await addOutput(page, 'i');
  await page.getByRole('button', { name: 'Tutup panel' }).click();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['1', '2', '3']);
  await page.getByRole('button', { name: 'Lihat seluruh alur', exact: true }).first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('for-mobile.png') });
});
