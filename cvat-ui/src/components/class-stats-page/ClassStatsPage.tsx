import React, { useEffect, useState, useRef } from 'react';
import { Card, Select, Spin, Empty, message } from 'antd';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ClassStat {
  class_id: number;
  class_name: string;
  number_of_images: number;
}

const ClassStatsPage: React.FC = () => {
  const [stats, setStats] = useState<ClassStat[]>([]);
  const [tasks, setTasks] = useState<{ id: number; name: string }[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchStats = async (taskId: number | null = null) => {
    setLoading(true);
    try {
      const params = taskId ? `?task_id=${taskId}` : '';
      const response = await fetch(`/api/test/class-image-stats/${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStats(data.stats || []);
    } catch (err) {
      message.error('Failed to load class statistics');
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      let allTasks: { id: number; name: string }[] = [];
      let page = 1;
      while (true) {
        const response = await fetch(`/api/tasks?page=${page}&page_size=100`, {
          credentials: 'include',
        });
        if (!response.ok) break;
        const data = await response.json();
        if (data.results.length === 0) break;
        allTasks = allTasks.concat(data.results.map((t: any) => ({ id: t.id, name: t.name })));
        page++;
      }
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks');
      message.error('Could not load tasks');
    }
  };

  useEffect(() => {
    loadTasks();
    fetchStats(selectedTaskId);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/events/`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.message?.model === 'annotation') {
          fetchStats(selectedTaskId);
        }
      } catch {}
    };

    return () => ws.close();
  }, [selectedTaskId]);

  const chartData = {
    labels: stats.map((s) => s.class_name),
    datasets: [{
      label: 'Number of Annotated Images',
      data: stats.map((s) => s.number_of_images),
      backgroundColor: 'rgba(75, 192, 192, 0.8)',
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Images per Class (Live Updates)' },
    },
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card title="Class Image Statistics">
        <Select
          placeholder="Select a task (optional)"
          allowClear
          style={{ width: 400, marginBottom: 24 }}
          onChange={(value) => setSelectedTaskId(value as number | null)}
        >
          {tasks.map((task) => (
            <Select.Option key={task.id} value={task.id}>
              {task.name} (ID: {task.id})
            </Select.Option>
          ))}
        </Select>

        {loading ? <Spin tip="Loading..." /> : stats.length === 0 ? <Empty /> : <Bar data={chartData} options={options} />}
      </Card>
    </div>
  );
};

export default ClassStatsPage;