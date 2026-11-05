// Node'un projedeki @/ kısayolunu src/ klasörüne çevirmesi için.
const SRC = new URL('../src/', import.meta.url);

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    return { url: new URL(`${specifier.slice(2)}.ts`, SRC).href, shortCircuit: true };
  }
  return next(specifier, context);
}
