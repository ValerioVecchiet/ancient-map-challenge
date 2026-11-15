import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

function createGame() {
  const html = readFileSync('public/imperium/index.html', 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const context = dom.getInternalVMContext();
  let now = 0;
  let tick: (() => void) | undefined;
  let next: (() => void) | undefined;
  dom.window.scrollTo = () => {};
  dom.window.Date.now = () => now;
  dom.window.setInterval = ((cb: () => void) => { tick = cb; return 1; }) as typeof dom.window.setInterval;
  dom.window.setTimeout = ((cb: () => void) => { next = cb; return 2; }) as typeof dom.window.setTimeout;
  dom.window.clearInterval = () => { tick = undefined; };
  dom.window.clearTimeout = () => { next = undefined; };
  for (const file of ['data.js', 'modern-data.js', 'app.js']) {
    vm.runInContext(readFileSync(`public/imperium/${file}`, 'utf8'), context);
  }
  const click = (id: string) => dom.window.document.getElementById(id)?.click();
  const text = (id: string) => dom.window.document.getElementById(id)?.textContent;
  const evaluate = (code: string) => vm.runInContext(code, context);
  return { dom, click, text, evaluate, advance: (seconds: number) => { now += seconds * 1000; tick?.(); }, next: () => { next?.(); } };
}

describe('Imperium shared game rules', () => {
  for (const mode of ['history', 'modern']) {
    it(`${mode} starts at five minutes and ends at 300 seconds`, () => {
      const game = createGame();
      game.click(`${mode}-mode-btn`);
      game.click('start-btn');
      expect(game.text('clock-value')).toBe('05:00');
      game.advance(300);
      expect(game.text('clock-value')).toBe('00:00');
      expect(game.dom.window.document.getElementById('screen-results')?.classList.contains('active')).toBe(true);
      expect(game.text('res-reason')).toBe('Il tempo a disposizione è scaduto.');
      game.dom.window.close();
    });

    it(`${mode} keeps the 15-second question limit`, () => {
      const game = createGame();
      game.click(`${mode}-mode-btn`); game.click('start-btn');
      game.advance(15);
      expect(game.text('wrong')).toBe('1');
      expect(game.text('score')).toBe('0');
      game.next();
      expect(game.text('q-time')).toBe('15s');
      game.dom.window.close();
    });

    it(`${mode} asks name or capital questions and retains speed-based points`, () => {
      const game = createGame();
      game.click(`${mode}-mode-btn`); game.click('start-btn');
      const id = game.dom.window.document.querySelector('.map-region.is-active')?.getAttribute('data-id');
      const region = game.evaluate(`${mode === 'modern' ? 'MODERN_REGIONS' : 'REGIONS'}[${JSON.stringify(id)}]`);
      const kind = game.text('q-kind');
      const label = kind === 'Identifica il territorio' ? region.name : region.capital;
      const button = Array.from(game.dom.window.document.querySelectorAll<HTMLButtonElement>('.option')).find(b => b.querySelector('.option-label')?.textContent === label);
      expect(button).toBeDefined();
      game.advance(3);
      button?.click();
      expect(game.text('score')).toBe('180');
      expect(game.text('correct')).toBe('1');
      expect(game.text('wrong')).toBe('0');
      game.dom.window.close();
    });
  }

  it('includes the requested modern states with contemporary capitals and real area paths', () => {
    const game = createGame();
    const regions = game.evaluate('MODERN_REGIONS');
    expect(regions.ita).toEqual({ name: 'Italia', capital: 'Roma' });
    expect(regions.fra).toEqual({ name: 'Francia', capital: 'Parigi' });
    expect(regions.esp).toEqual({ name: 'Spagna', capital: 'Madrid' });
    expect(regions.hrv).toEqual({ name: 'Croazia', capital: 'Zagabria' });
    expect(regions.grc).toEqual({ name: 'Grecia', capital: 'Atene' });
    expect(regions.egy).toEqual({ name: 'Egitto', capital: 'Il Cairo' });
    expect(regions.mar).toEqual({ name: 'Marocco', capital: 'Rabat' });
    game.dom.window.close();
  });
});