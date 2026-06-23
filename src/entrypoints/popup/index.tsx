import styles from './Popup.module.scss';
import pkgText from '../../../package.json?raw';
import { createRoot } from 'react-dom/client';
const pkg = JSON.parse(pkgText) as {
  name?: string;
  version?: string;
  description?: string;
  author?: string | { name?: string };
  repository?: {
    url?: string;
  };
};

export default function Popup() {
  const project = {
    name: pkg.name ?? '',
    authors: (pkg.author as string) ?? pkg.author ?? '',
    version: pkg.version ?? '',
    description: pkg.description ?? '',
    url: pkg.repository?.url ?? '',
  };

  return (
    <div className={styles.popup}>
      <img src="./beliani_logo.svg" width="50%" style={{ maxWidth: '200px' }} alt="Popup Image" />
      <table cellPadding={0} cellSpacing={0} width="100%">
        <thead>
          <tr>
            <th>Extension Name</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{project.name}</td>
            <td>{project.version}</td>
          </tr>
        </tbody>
      </table>

      <table cellPadding={0} cellSpacing={0} width="100%">
        <thead>
          <tr>
            <th>Created By</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{project.authors}</td>
            <td>{project.description}</td>
          </tr>
        </tbody>
      </table>

      <p>
        Project URL:{' '}
        <a href={project.url} target="_blank" rel="noopener noreferrer">
          {project.url}
        </a>
      </p>
    </div>
  );
}

function App() {
  return <Popup />;
}

const root = document.getElementById('root')!;

createRoot(root).render(<App />);
