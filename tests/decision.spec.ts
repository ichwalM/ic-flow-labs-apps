import { test, expect, type Page } from '@playwright/test';
import { programFixture, type SourceInstruction } from '../packages/interpreter/src/fixtures';

const output = (text: string): SourceInstruction => ({ kind: 'output', mode: 'text', text });
const branch = (condition: string, consequent: SourceInstruction[] = [], alternate: SourceInstruction[] = []): SourceInstruction => ({ kind: 'decision', condition, consequent, alternate });
const outline = (page: Page) => page.getByRole('navigation', { name: 'Urutan langkah' });
async function load(page: Page, source: SourceInstruction[]) {
  const doc = programFixture(source);
  await page.goto('/');
  await page.getByLabel('Pilih file algoritma').setInputFiles({ name: 'decision.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await expect(page.locator('.algorithm-node.diamond')).toHaveCount(source.filter(step => step.kind === 'decision').length || 1);
  return doc;
}
async function addOutput(page: Page, text: string) {
  await page.getByRole('button', { name: /Tampilkan output Tampilkan pesan/ }).click();
  await page.getByLabel('Pesan yang ditampilkan').fill(text);
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
}

test('build a score decision through forms, execute both paths, preserve edits and recover v4', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Tambah langkah 1', exact: true }).click();
  await page.getByRole('button', { name: /Deklarasikan variabel Siapkan/ }).click();
  await page.getByLabel('Nama variabel').fill('nilai');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah langkah 2', exact: true }).click();
  await page.getByRole('button', { name: /Masukkan data Minta/ }).click();
  await page.getByLabel('Simpan ke variabel').fill('nilai');
  await page.getByLabel('Pesan untuk pengguna').fill('Masukkan nilai ujian');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah langkah 3', exact: true }).click();
  await page.getByRole('button', { name: /Periksa kondisi Pilih/ }).click();
  await page.getByLabel('Kondisi').fill('nilai >= 75');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await expect(page.locator('.algorithm-node.diamond')).toHaveCount(1);
  await page.getByRole('button', { name: 'Tambah di cabang Ya', exact: true }).click();
  await addOutput(page, 'Lulus');
  await outline(page).getByRole('button', { name: 'nilai >= 75 ?' }).click();
  await page.getByRole('button', { name: 'Tambah di cabang Tidak', exact: true }).click();
  await addOutput(page, 'Tidak Lulus');
  await outline(page).getByRole('button', { name: 'nilai >= 75 ?' }).click();
  await page.getByRole('button', { name: 'Tambah setelah penggabungan' }).click();
  await addOutput(page, 'Penilaian selesai');
  for (const [score, expected, selected] of [['80', 'Lulus', 'Ya'], ['60', 'Tidak Lulus', 'Tidak']]) {
    await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
    await page.getByLabel('Nilai masukan', { exact: true }).fill(score!);
    await page.getByRole('button', { name: 'Kirim masukan' }).click();
    await expect(page.getByText('Program selesai', { exact: true })).toBeVisible();
    await expect(page.locator('.output-line pre')).toHaveText([expected!, 'Penilaian selesai']);
    await expect(page.locator('.branch-insert.is-executed')).toHaveText(`✓ ${selected}`);
    await expect(page.locator('.parallelogram[data-executed=true]').filter({ hasText: expected }).first()).toBeAttached();
    await expect(page.locator('.flow-traversed')).toHaveCount(7);
  }
  await page.getByRole('button', { name: 'Lihat seluruh alur', exact: true }).first().click();
  await page.screenshot({ path: testInfo.outputPath('decision-desktop.png') });
  await outline(page).getByRole('button', { name: 'nilai >= 75 ?' }).click();
  await page.getByLabel('Kondisi').fill('nilai >= 70');
  await page.getByRole('button', { name: 'Simpan instruksi' }).click();
  await expect(page.locator('.flow-traversed')).toHaveCount(0);
  await expect(outline(page).getByRole('button')).toHaveText(['MulaiSTART', 'nilai : Integer', 'INPUT nilai', 'nilai >= 70 ?', '“Lulus”', '“Tidak Lulus”', '“Penilaian selesai”', 'SelesaiEND']);
  await expect(page.getByText('Draft tersimpan', { exact: true })).toBeVisible();
  await page.reload();
  await expect(outline(page).getByRole('button', { name: 'nilai >= 70 ?' })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('flowlab.draft.v1')!));
  expect(stored.schemaVersion).toBe(4);
  expect(stored.program.instructions[2].consequent[0].text).toBe('Lulus');
  expect(stored.program.instructions[2].alternate[0].text).toBe('Tidak Lulus');
  expect(stored).not.toHaveProperty('events');
  expect(errors).toEqual([]);
});

test('insert via empty branch edges and the merge, then delete a subtree with cancel and undo', async ({ page }) => {
  const doc = await load(page, [branch('true')]);
  await page.getByRole('button', { name: /Tambah langkah cabang Ya/ }).click();
  await page.getByRole('button', { name: /Periksa kondisi Pilih/ }).click();
  await page.getByLabel('Kondisi').fill('false');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Tambah di cabang Tidak', exact: true }).click();
  await addOutput(page, 'Di dalam');
  await outline(page).getByRole('button', { name: 'true ?', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah setelah penggabungan' }).click();
  await addOutput(page, 'Sesudah');
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['Di dalam', 'Sesudah']);
  await outline(page).getByRole('button', { name: 'true ?', exact: true }).click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Hapus instruksi' }).click();
  await expect(page.locator('.diamond')).toHaveCount(2);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Hapus instruksi' }).click();
  await expect(page.locator('.diamond')).toHaveCount(0);
  await expect(outline(page).getByRole('button')).toHaveText(['MulaiSTART', '“Sesudah”', 'SelesaiEND']);
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
  await expect(page.locator('.diamond')).toHaveCount(2);
  await expect(page.locator(`[data-id="${doc.program.instructions[0]!.id}"]`)).toBeAttached();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['Di dalam', 'Sesudah']);
});

test('Boolean and incomplete declaration diagnostics focus their source instructions', async ({ page }) => {
  await load(page, [branch('1', [output('Must not run')])]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await page.getByRole('button', { name: /membutuhkan Boolean, tetapi mendapat Integer/ }).click();
  await expect(page.getByLabel('Kondisi')).toHaveValue('1');
  await page.getByLabel('Kondisi').fill('true');
  await page.getByRole('button', { name: 'Simpan instruksi' }).click();
  await page.getByRole('button', { name: 'Tambah di cabang Ya', exact: true }).click();
  await page.getByRole('button', { name: /Deklarasikan variabel Siapkan/ }).click();
  await page.getByLabel('Nama variabel').fill('x');
  await page.getByLabel('Nilai awal').fill('1');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await outline(page).getByRole('button', { name: 'true ?', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah setelah penggabungan' }).click();
  await page.getByRole('button', { name: /Tampilkan output Tampilkan pesan/ }).click();
  await page.getByLabel('Jenis output').selectOption('expression');
  await page.getByLabel('Ekspresi output').fill('x');
  await page.getByRole('button', { name: 'Tambahkan ke alur' }).click();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await page.getByRole('button', { name: /belum pasti dibuat di semua cabang/ }).click();
  await expect(page.getByLabel('Ekspresi output')).toHaveValue('x');
  await expect(page.locator('.flow-traversed')).toHaveCount(0);
});

test('false branch can be empty and its chosen edge is visible after execution', async ({ page }) => {
  await load(page, [branch('false', [output('Skipped')]), output('After')]);
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['After']);
  await expect(page.locator('.branch-insert.is-executed')).toHaveText('✓ Tidak');
  await expect(page.locator('.merge-node.is-executed')).toHaveCount(1);
  await expect(page.locator('.parallelogram[data-executed=false]').filter({ hasText: 'Skipped' })).toHaveCount(1);
});

test('mobile can edit and execute a branch through keyboard-accessible controls', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, [branch('false', [output('Ya')], [output('Tidak')])]);
  await page.getByRole('button', { name: 'Buka panduan' }).click();
  await outline(page).getByRole('button', { name: 'false ?', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Kondisi').fill('true');
  await page.getByRole('button', { name: 'Simpan instruksi' }).click();
  await page.getByRole('button', { name: 'Tambah di cabang Ya', exact: true }).click();
  await addOutput(page, 'Pertama');
  await page.getByRole('button', { name: 'Tutup panel' }).click();
  await page.getByRole('button', { name: 'Jalankan', exact: true }).click();
  await expect(page.locator('.output-line pre')).toHaveText(['Pertama', 'Ya']);
  await page.getByRole('button', { name: 'Lihat seluruh alur', exact: true }).first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('decision-mobile.png') });
});
