import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import './App.css';

function App() {
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [nuevoVehiculo, setNuevoVehiculo] = useState({ 
    nombre: '',
    color: '',
    año: '',
    combustible: '',
    precio: '',
    descripcion: '',
    imagen: null
  });
  const [vehiculoActualizado, setVehiculoActualizado] = useState({ 
    id: '',
    nombre: '',
    color: '',
    año: '',
    combustible: '',
    precio: '',
    descripcion: '',
    imagen: null
  });
  const [mostrarFormularioActualizar, setMostrarFormularioActualizar] = useState(false);
  const [reloadPage, setReloadPage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerVehiculos();
  }, [reloadPage]);

  const obtenerVehiculos = async () => {
    const vehiculosRef = collection(db, 'Vehiculos');
    const q = query(vehiculosRef, orderBy('nombre'));
    const vehiculosSnapshot = await getDocs(q);
    const vehiculosData = [];
    await Promise.all(vehiculosSnapshot.docs.map(async doc => {
      const vehiculoData = doc.data();
      const imagenRef = ref(storage, `${doc.id}.jpg`);
      try {
        const url = await getDownloadURL(imagenRef);
        vehiculosData.push({ id: doc.id, ...vehiculoData, imagenUrl: url }); 
      } catch (error) {
        console.error(`Error al obtener la imagen para el vehículo con ID ${doc.id}:`, error);
        vehiculosData.push({ id: doc.id, ...vehiculoData, imagenUrl: null });
      }
    }));
    setVehiculos(vehiculosData);
  };

  const handleInputChange = (e) => {
    setBusqueda(e.target.value);
    setError('');
  };

  const filtrarVehiculos = (vehiculos, busqueda) => {
    return vehiculos.filter(vehiculo =>
      vehiculo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.color.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.año.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.precio.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.combustible.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const handleNuevoVehiculoChange = (e) => {
    const { name, value } = e.target;
    setNuevoVehiculo(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const handleImagenChange = (e) => {
    const imagen = e.target.files[0];
    setNuevoVehiculo(prevState => ({
      ...prevState,
      imagen
    }));
    setError('');
  };

  const handleVehiculoActualizadoChange = (e) => {
    const { name, value } = e.target;
    setVehiculoActualizado(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const mostrarFormulario = (vehiculo) => {
    setVehiculoActualizado(vehiculo);
    setMostrarFormularioActualizar(true);
    setError('');
  };

  const ocultarFormulario = () => {
    setMostrarFormularioActualizar(false);
    setError('');
  };

  const agregarVehiculo = async () => {
    let id = null;
    try {
      const { nombre, color, año, combustible, precio, descripcion, imagen } = nuevoVehiculo; 

      if (!nombre || !color || !año || !combustible || !precio || !descripcion || !imagen) { 
        setError('Todos los campos son obligatorios');
        return;
      }

      if (isNaN(parseInt(año))) {
        setError('El año debe ser un número válido');
        return;
      }

      const nuevoVehiculoRef = await addDoc(collection(db, "Vehiculos"), { nombre, color, año, combustible, precio, descripcion });
      id = nuevoVehiculoRef.id;
      const imagenRef = ref(storage, `${id}.jpg`);
      await uploadBytes(imagenRef, imagen);
      const imageUrl = await getDownloadURL(imagenRef);
      console.log("Imagen subida a Firebase Storage");

      const nuevoVehiculoData = {
        nombre, color, año, combustible, precio, descripcion, imagenUrl: imageUrl, imagen: `${id}.jpg`
      };

      await updateDoc(doc(db, "Vehiculos", id), nuevoVehiculoData);
      console.log("Nuevo vehículo agregado a la base de datos");

      setReloadPage(prevState => !prevState);

      setNuevoVehiculo({ nombre: '', color: '', año: '', combustible: '', precio: '', descripcion: '', imagen: null });

      document.getElementById('file-input').value = null;
    } catch (e) {
      console.error("Error Añadiendo Documento: ", e);
    }
  };

  const eliminarVehiculo = async (id) => {
    try {
      await deleteDoc(doc(db, "Vehiculos", id)); 
      console.log("Documento Eliminado Exitosamente!");
      await deleteObject(ref(storage, `${id}.jpg`));
      setReloadPage(prevState => !prevState);
    } catch (error) {
      console.error("Error Eliminando Documento: ", error);
    }
  };

  const actualizarVehiculo = async () => {
    try {
      await updateDoc(doc(db, "Vehiculos", vehiculoActualizado.id), vehiculoActualizado);
      console.log("Document successfully updated!");
      setReloadPage(prevState => !prevState);
      ocultarFormulario();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <div>
      <h1>Lista de Vehículos</h1>
      <input type="text" placeholder="Buscar vehículos" value={busqueda} onChange={handleInputChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {filtrarVehiculos(vehiculos, busqueda).map(vehiculo => (
          <li key={vehiculo.id} className="vehiculo">
            {vehiculo.imagenUrl && <img src={vehiculo.imagenUrl} alt={vehiculo.nombre} />} {}
            <div>
              <h2>{vehiculo.nombre} {vehiculo.color}</h2>
              <p>Año: {vehiculo.año} Combustible: {vehiculo.combustible} Descripcion: {vehiculo.descripcion} Precio: {vehiculo.precio}</p>
              <button onClick={() => eliminarVehiculo(vehiculo.id)}>Eliminar</button>
              <button onClick={() => mostrarFormulario(vehiculo)}>Actualizar</button>
            </div>
          </li>
        ))}
      </ul>
      <h2>Agregar nuevo vehículo</h2>
      <input type="text" name="nombre" placeholder="Nombre" value={nuevoVehiculo.nombre} onChange={handleNuevoVehiculoChange} />
      <input type="text" name="color" placeholder="Color" value={nuevoVehiculo.color} onChange={handleNuevoVehiculoChange} />
      <input type="text" name="año" placeholder="Año" value={nuevoVehiculo.año} onChange={handleNuevoVehiculoChange} />
      <input type="text" name="precio" placeholder="Precio" value={nuevoVehiculo.precio} onChange={handleNuevoVehiculoChange} />
      <input type="text" name="descripcion" placeholder="Descripcion" value={nuevoVehiculo.descripcion} onChange={handleNuevoVehiculoChange} />
      <input type="text" name="combustible" placeholder="Combustible" value={nuevoVehiculo.combustible} onChange={handleNuevoVehiculoChange} />
      {}
      <input id="file-input" type="file" accept="image/*" onChange={handleImagenChange} />
      <button onClick={agregarVehiculo}>Agregar</button>

      {mostrarFormularioActualizar && (
        <div>
          <h2>Actualizar vehículo</h2>
          <input type="text" name="nombre" placeholder="Nombre" value={vehiculoActualizado.nombre} onChange={handleVehiculoActualizadoChange} />
          <input type="text" name="color" placeholder="Color" value={vehiculoActualizado.color} onChange={handleVehiculoActualizadoChange} />
          <input type="text" name="año" placeholder="Año" value={vehiculoActualizado.año} onChange={handleVehiculoActualizadoChange} />
          <input type="text" name="precio" placeholder="Precio" value={vehiculoActualizado.precio} onChange={handleVehiculoActualizadoChange} />
          <input type="text" name="descripcion" placeholder="Descripcion" value={vehiculoActualizado.descripcion} onChange={handleVehiculoActualizadoChange} />
          <input type="text" name="combustible" placeholder="Combustible" value={vehiculoActualizado.combustible} onChange={handleVehiculoActualizadoChange} />
          <button onClick={actualizarVehiculo}>Actualizar</button>
          <button onClick={ocultarFormulario}>Cancelar</button>
        </div>
      )}

    </div>
  );
}

export default App;
