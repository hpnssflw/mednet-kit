import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}
export function jsonFile(file) {
  if (fs.statSync(file).size > 512 * 1024) throw new CliError('Слишком большой JSON: ' + file, 2);
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Expected object');
    return value;
  } catch {
    throw new CliError('Некорректный JSON: ' + file, 2);
  }
}
export function slash(value) {
  return value.split(path.sep).join('/');
}
export function inside(root, target) {
  const rel = path.relative(root, target);
  return !path.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + path.sep);
}
export function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
export function bytesAt(file) {
  try {
    if (!fs.lstatSync(file).isFile()) throw new CliError('Ожидался обычный файл: ' + file);
    return fs.readFileSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
export function safeDestination(root, name) {
  if (
    typeof name !== 'string' ||
    !name ||
    name.includes('\\') ||
    path.isAbsolute(name) ||
    name.split('/').some((p) => !p || p === '.' || p === '..' || p === '.git') ||
    name.includes(':')
  )
    throw new CliError('Недопустимый путь назначения: ' + name);
  const target = path.resolve(root, name);
  if (!inside(root, target)) throw new CliError('Путь вне области установки: ' + name);
  let cursor = root;
  for (const part of name.split('/')) {
    cursor = path.join(cursor, part);
    let stat;
    try {
      stat = fs.lstatSync(cursor);
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
    if (stat.isSymbolicLink())
      throw new CliError('Запись через symlink/junction запрещена: ' + cursor);
    if (cursor !== target && !stat.isDirectory()) throw new CliError('Ожидался каталог: ' + cursor);
  }
  return target;
}
export function ancestors(root, leaf) {
  const result = [];
  let cursor = leaf;
  if (!inside(root, leaf)) throw new CliError('Проект находится вне репозитория', 2);
  while (true) {
    result.unshift(cursor);
    if (cursor === root) return result;
    cursor = path.dirname(cursor);
  }
}
