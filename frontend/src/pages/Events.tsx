import { useEffect, useState } from 'react';
import axios from 'axios';

interface Event {
  title: string;
  description: string;
  date: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const role = localStorage.getItem('role');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get<Event[]>('http://localhost:3001/events', config)
      .then(res => setEvents(res.data))
      .catch(err => console.log(err));
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !description || !date) return;
    try {
      const newEvent = { title, description, date };
      await axios.post('http://localhost:3001/events', newEvent, config);
      setEvents([...events, newEvent]);
      setTitle(''); setDescription(''); setDate('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Événements</h1>

      {role === 'Admin' && (
        <form onSubmit={handleAdd} className="mb-6 p-4 border rounded">
          <input
            type="text"
            placeholder="Titre"
            className="mb-2 p-2 border"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description"
            className="mb-2 p-2 border"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <input
            type="date"
            className="mb-2 p-2 border"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Créer événement</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((ev, i) => (
          <div key={i} className="p-4 border rounded">
            <h2 className="font-bold">{ev.title}</h2>
            <p>{ev.description}</p>
            <p className="text-gray-500">{ev.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}