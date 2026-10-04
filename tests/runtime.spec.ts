import { test, expect, type Page } from '@playwright/test';
import { programFixture, type SourceInstruction } from '../packages/interpreter/src/fixtures';

async function load(page: Page, source: SourceInstruction[]) {
  const document = programFixture(source);
  await page.goto('/');
  await page.getByLabel('Pilih file algoritma').setInputFiles({ name: 'program.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) });
  return document;
}
const inputProgram: SourceInstruction[] = [
  { kind: 'declaration', name: 'nilai', dataType: 'Integer', initialValue: '' },
  { kind: 'input', target: 'nilai', prompt: 'Masukkan angka' },
  { kind: 'assignment', target: 'nilai', expression: 'nilai * 2' },
  { kind: 'output', mode: 'expression', text: '"Hasil: " + nilai' },
];
test('create and execute declaration, input, process and expression output', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Tambah langkah 1', exact: true }).click();
  await page.getByRole('button', { name: /Deklarasikan variabel Siapkan/ }).click();
  await page.getByLabel('Nama variabel').fill('nilai');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah langkah 2', exact: true }).click();
  await page.getByRole('button', { name: /Masukkan data Minta/ }).click();
  await page.getByLabel('Simpan ke variabel').fill('nilai');
  await page.getByLabel('Pesan untuk pengguna').fill('Masukkan angka');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah langkah 3', exact: true }).click();
  await page.getByRole('button', { name: /Ubah nilai Hitung/ }).click();
  await page.getByLabel('Simpan ke variabel').fill('nilai');
  await page.getByLabel('Nilai atau ekspresi').fill('nilai * 2');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah langkah 4', exact: true }).click();
  await page.getByRole('button', { name: /Tampilkan output Tampilkan pesan/ }).click();
  await page.getByLabel('Jenis output').selectOption('expression');
  await page.getByLabel('Ekspresi output').fill('"Hasil: " + nilai');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.getByText('Menunggu masukan', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Nilai masukan', { exact: true })).toBeFocused();
  await page.getByLabel('Nilai masukan', { exact: true }).fill('abc');
  await page.getByRole('button', { name: 'Kirim masukan' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'membutuhkan angka bulat' })).toBeVisible();
  await page.getByLabel('Nilai masukan', { exact: true }).fill('6');
  await page.getByLabel('Nilai masukan', { exact: true }).press('Enter');
  await expect(page.getByRole('log')).toContainText('Hasil: 12');
  await expect(page.getByText('Program selesai', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Variabel', exact: true }).click();
  await expect(page.getByRole('tabpanel').locator('.runtime-variable')).toContainText('12');
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await page.getByLabel('Nilai masukan', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Kirim masukan' }).click();
  await expect(page.getByRole('log')).toContainText('Hasil: 20');
  await expect(page.getByRole('log')).not.toContainText('Hasil: 12');
  expect(errors).toEqual([]);
});
test('semantic errors block all execution and navigate to the affected node', async ({ page }) => {
  await load(page, [{ kind: 'output', mode: 'text', text: 'Tidak boleh tercetak' }, { kind: 'output', mode: 'expression', text: 'belumAda' }]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Masalah/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: /Variabel "belumAda" belum dibuat/ }).click();
  await expect(page.getByLabel('Ekspresi output')).toHaveValue('belumAda');
  await page.getByRole('tab', { name: 'Console' }).click();
  await expect(page.getByRole('log')).not.toContainText('Tidak boleh tercetak');
});
test('runtime arithmetic errors are separate from program output', async ({ page }) => {
  await load(page, [{ kind: 'output', mode: 'text', text: 'Sebelum' }, { kind: 'output', mode: 'expression', text: '1 / 0' }, { kind: 'output', mode: 'text', text: 'Sesudah' }]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.getByRole('button', { name: /Tidak dapat membagi dengan nol/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Console' }).click();
  await expect(page.getByRole('log')).toContainText('Sebelum');
  await expect(page.getByRole('log')).not.toContainText('Sesudah');
});
test('Stop, Reset and program edits cancel pending input', async ({ page }) => {
  await load(page, inputProgram);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.getByLabel('Nilai masukan', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hentikan', exact: true }).click();
  await expect(page.getByLabel('Nilai masukan', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Program dihentikan', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset eksekusi' }).click();
  await expect(page.getByText('Siap dijalankan', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.getByLabel('Nilai masukan', { exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Urutan langkah' }).getByRole('button', { name: 'nilai ← nilai * 2', exact: true }).click();
  await page.getByLabel('Nilai atau ekspresi').fill('nilai * 3');
  await page.getByRole('button', { name: 'Simpan instruksi' }).click();
  await expect(page.getByText('Siap dijalankan', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Nilai masukan', { exact: true })).toHaveCount(0);
});
test('legacy local drafts migrate to literal output and save v4', async ({ page }) => {
  const document = programFixture([{ kind: 'output', mode: 'text', text: '1 + unknown' }]);
  const legacy = { ...document, schemaVersion: 1, program: { ...document.program, instructions: [{ id: document.program.instructions[0]!.id, kind: 'output', text: '1 + unknown' }] } };
  await page.addInitScript((source) => localStorage.setItem('flowlab.draft.v1', source), JSON.stringify(legacy));
  await page.goto('/');
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('1 + unknown');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('flowlab.draft.v1')!).schemaVersion)).toBe(4);
});
test('mobile can provide input and read the console without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, inputProgram);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await page.getByLabel('Nilai masukan', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Kirim masukan' }).click();
  await expect(page.getByRole('log')).toContainText('Hasil: 16');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('runtime tabs support arrow-key navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Console' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Masalah' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Masalah' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Variabel', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Console' })).toBeFocused();
});
