const STORAGE_KEY = 'filmlog_data';

const defaultData = {
  categories: [
    {
      id: '1', name: 'Аниме', color: '#B8311A', image: null, imagePosition: { x: 50, y: 50, scale: 100 },
      films: [
        { id: '1', name: 'Атака титанов', rating: 7 },
        { id: '2', name: 'Клинок, рассекающий демонов', rating: 10 },
        { id: '3', name: 'Твоё имя', rating: null },
        { id: '4', name: 'Тетрадь смерти', rating: 6 },
        { id: '5', name: 'Монстр', rating: null },
      ]
    },
    {
      id: '2', name: 'Ужасы', color: '#6B2D8C', image: null,
      films: [
        { id: '1', name: 'Когда плачут цикады', rating: null },
        { id: '2', name: 'Реинкарнация', rating: null },
        { id: '3', name: 'Солнцестояние', rating: null },
        { id: '4', name: 'Закулисье', rating: null },
      ]
    },
    {
      id: '3', name: 'Комедии', color: '#3A7D44', image: null,
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

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Storage full or failed', e);
  }
}

export function getCategories() { return getData().categories; }

export function addCategory(name, color, image = null, imagePosition = { x: 50, y: 50, scale: 100 }) {
  const data = getData();
  const newCat = { id: Date.now().toString(), name, color, image, imagePosition, films: [] };
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

export const CATEGORY_COLORS = [
  '#B8311A', '#D98E2C', '#6B2D8C', '#3A7D44', '#1F6F78', '#A8492F',
  '#4A4E69', '#8C6A3F', '#2E5A3E', '#9C2C4F', '#5B7B9A', '#7A5230',
];

// Rating color depends on the score, not the category:
// < 4 red, 4–6 gray, >= 7 green
export function ratingColor(rating) {
  if (rating < 4) return '#FF453A';
  if (rating < 7) return '#8E8E93';
  return '#30D158';
}
