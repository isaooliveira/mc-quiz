type NavDir = 'fwd' | 'back';

/**
 * Marca a direção da próxima transição de rota para o CSS de View Transitions.
 * Chamar imediatamente antes de navigate(..., { viewTransition: true }).
 * Sem classe = avançar (entra pela direita). Classe nav-back = voltar (espelha).
 */
export function setNavDir(dir: NavDir) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('nav-back', dir === 'back');
}
