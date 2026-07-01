const STORAGE_KEY = 'filmlog_data';

const defaultData = {
  categories: [
    {
      id: '1',
      name: 'Аниме',
      color: '#B8311A',
      films: [
        { id: '1', name: 'Атака титанов', rating: 7 },
        { id: '2', name: 'Клинок, рассекающий демонов', rating: 10 },
        { id: '3', name: 'Твоё имя', rating: null },
        { id: '4', name: 'Тетрадь смерти', rating: 6 },
        { id: '5', name: 'Монстр', rating: null },
      ]
    },
    {
      id: '2',
      name: 'Ужасы',
      color: '#6B2D8C',
      films: [
        { id: '1', name: 'Когда плачут цикады', rating: null },
        { id: '2', name: 'Реинкарнация', rating: null },
        { id: '3', name: 'Солнцестояние', rating: null },
        { id: '4', name: 'Закулисье', rating: null },
      ]
    },
    {
      id: '3',
      name: 'Комедии',
      color: '#3A7D44',
      films: [
        { id: '1', name: 'Мы — Миллеры', rating: null },
        { id: '2', name: 'Убойные каникулы', rating: null },
      ]
    },
  ]
};

export function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultData;
  } catch { return defaultData; }
}

export function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
export function getCategories() { return getData().categories; }

export function addCategory(name, color) {
  const data = getData();
  const newCat = { id: Date.now().toString(), name, color, films: [] };
  data.categories.push(newCat);
  saveData(data);
  return newCat;
}

export function updateCategory(id, updates) {
  const data = getData();
  data.categories = data.categories.map(c => c.id === id ? { ...c, ...updates } : c);
  saveData(data);
}

export function deleteCategory(id) {
  const data = getData();
  data.categories = data.categories.filter(c => c.id !== id);
  saveData(data);
}

export function addFilm(categoryId, name) {
  const data = getData();
  const cat = data.categories.find(c => c.id === categoryId);
  if (!cat) return;
  const newFilm = { id: Date.now().toString(), name, rating: null };
  cat.films.push(newFilm);
  saveData(data);
  return newFilm;
}

export function updateFilm(categoryId, filmId, updates) {
  const data = getData();
  const cat = data.categories.find(c => c.id === categoryId);
  if (!cat) return;
  cat.films = cat.films.map(f => f.id === filmId ? { ...f, ...updates } : f);
  saveData(data);
}

export function deleteFilm(categoryId, filmId) {
  const data = getData();
  const cat = data.categories.find(c => c.id === categoryId);
  if (!cat) return;
  cat.films = cat.films.filter(f => f.id !== filmId);
  saveData(data);
}

// Cinematic, muted palette — like film cans and darkroom labels
export const CATEGORY_COLORS = [
  '#B8311A', // safelight red
  '#D98E2C', // amber
  '#6B2D8C', // deep violet
  '#3A7D44', // forest
  '#1F6F78', // teal
  '#A8492F', // rust
  '#4A4E69', // slate
  '#8C6A3F', // bronze
  '#2E5A3E', // pine
  '#9C2C4F', // wine
  '#5B7B9A', // dusk blue
  '#7A5230', // sepia
];
