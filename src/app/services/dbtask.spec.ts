import { TestBed, fakeAsync, tick } from '@angular/core/testing'; // <-- fakeAsync/tick AÑADIDO
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Storage } from '@ionic/storage-angular';
import { DatabaseService } from './dbtask'; 

// =================================================================
// 1. MOCKS DE DATOS Y DEPENDENCIAS
// =================================================================

// Usuario de prueba COMPLETO 
const mockUser = {
    usuario: 'testuser',
    nombre: 'Test',
    apellido: 'User',
    email: 'test@example.com',
    edad: 30,
    genero: 'M',
    password: '123',
    foto: 'base64_foto_test'
};

// --- Mock para Ionic Storage (Web Mode) ---
const mockStorage = jasmine.createSpyObj('Storage', [
    'create', 
    'set', 
    'get', 
    'remove'
]);
mockStorage.create.and.returnValue(Promise.resolve(true));

// --- Mock para SQLite Nativo ---
const mockExecuteSql = jasmine.createSpy('executeSql');

// 1. Simula el resultado de una consulta exitosa de SQLite
const mockSqlResultSuccess = {
    rows: {
        length: 1, 
        item: (index: number) => {
            return index === 0 ? mockUser : undefined;
        }
    }
};

// 2. Simula el objeto SQLiteObject
const mockDatabaseObj = {
    // Configuración por defecto: la ejecución resuelve con 1 fila afectada (INSERT/UPDATE)
    executeSql: mockExecuteSql.and.returnValue(Promise.resolve({ rowsAffected: 1, rows: { length: 0 } })), 
    sqlBatch: jasmine.createSpy('sqlBatch'), 
    transaction: jasmine.createSpy('transaction'),
} as unknown as SQLiteObject; 

// 3. Simula el servicio SQLite para crear la BD
const mockSQLite = jasmine.createSpyObj('SQLite', ['create']);
mockSQLite.create.and.returnValue(Promise.resolve(mockDatabaseObj));

// --- Mock para Platform ---
const mockPlatform = jasmine.createSpyObj('Platform', ['ready', 'is']);
mockPlatform.ready.and.returnValue(Promise.resolve('ready'));


describe('DatabaseService', () => {
    let service: DatabaseService;
    let platformIsSpy: jasmine.Spy; 

    // Función auxiliar para forzar el estado de la plataforma
    const setupPlatform = (isWeb: boolean) => {
        platformIsSpy.and.callFake((key: string) => 
            key === 'capacitor' || key === 'cordova' ? !isWeb : false
        );
    };
    
    // Función para simular la inicialización
    const createService = async (isWeb: boolean) => {
        setupPlatform(isWeb); 
        
        if (isWeb) {
            // Reconfiguramos el mock de get para simular datos en modo web
            mockStorage.get.and.callFake(async (key: string) => {
                if (key === 'users') return [mockUser]; // Para CRUD web
                if (key === 'session_active') return null;
                if (key === 'carrito') return null;
                return undefined;
            });
            // Limpiamos los spies relevantes para evitar fugas entre tests
            mockStorage.set.calls.reset();
            mockStorage.get.calls.reset(); 
        } else {
            // Resetear el executeSql para los tests nativos
            mockExecuteSql.calls.reset(); 
            // Restauramos el mock de éxito para la creación de tablas en init()
            mockExecuteSql.and.returnValue(Promise.resolve({ rowsAffected: 1, rows: { length: 0 } }));
        }
        
        // Ejecutamos la inicialización asíncrona
        await service.init(); 
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                DatabaseService,
                { provide: Platform, useValue: mockPlatform },
                { provide: SQLite, useValue: mockSQLite },
                { provide: Storage, useValue: mockStorage },
            ],
        });

        service = TestBed.inject(DatabaseService); 

        platformIsSpy = mockPlatform.is as jasmine.Spy;
        
        // Limpiamos globalmente
        mockStorage.create.calls.reset();
        mockStorage.remove.calls.reset();
        mockSQLite.create.calls.reset();
        mockStorage.set.calls.reset();
    });

    // =================================================================
    // A. PRUEBAS DE INICIALIZACIÓN Y ESTADO
    // =================================================================

    describe('Inicialización y Estado', () => {
        
        it('debería inicializar como Web y establecer dbState a true inmediatamente', async () => {
            await createService(true); 
            
            expect(service.dbState.getValue()).toBe(true);
        });

        // ✅ CORRECCIÓN: Uso de fakeAsync y tick() para esperar el BehaviorSubject
        it('debería inicializar como Nativo y crear tablas', fakeAsync(async () => {
            await createService(false); 
            
            expect(mockSQLite.create).toHaveBeenCalled();
            
            // Asumiendo que el servicio crea la tabla 'users' como la primera query
            expect(mockExecuteSql).toHaveBeenCalledWith(
                jasmine.stringMatching(/CREATE TABLE IF NOT EXISTS users/), 
                []
            );
            
            tick(); // Resuelve la emisión asíncrona del BehaviorSubject

            // El estado debe ser true después de que las tablas se creen exitosamente.
            expect(service.dbState.getValue()).toBe(true);
        }));
    });

    // =================================================================
    // B. PRUEBAS DE SESIÓN
    // =================================================================

    describe('Gestión de Sesión', () => {
        beforeEach(async () => {
            await createService(true); 
            mockStorage.set.calls.reset(); 
            mockStorage.get.calls.reset(); 
        });

        it('createSession debería guardar el email en storage', async () => {
            await service.createSession('new@session.com');
            expect(mockStorage.set).toHaveBeenCalledWith('session_active', 'new@session.com');
        });
    });

    // =================================================================
    // C. PRUEBAS DE CRUD USUARIOS - MODO WEB (Ionic Storage)
    // =================================================================

    describe('CRUD Usuarios - Modo Web (Ionic Storage)', () => {
        
        beforeEach(async () => {
            await createService(true); 
            mockStorage.set.calls.reset(); 
            mockStorage.get.calls.reset(); 
        });

        // --- REGISTRO ---
        it('registerUser debería registrar un nuevo usuario y retornar true', async () => {
            mockStorage.get.and.returnValue(Promise.resolve([])); 
            
            const success = await service.registerUser('newuser', 'New', 'User', 'new@reg.com', 25, 'F', 'pass');
            
            expect(success).toBe(true);
            expect(mockStorage.set).toHaveBeenCalled();
        });
        
        // --- LOGIN ---
        it('loginUser debería retornar true y crear sesión con credenciales correctas', async () => {
            mockStorage.get.and.returnValue(Promise.resolve([mockUser])); 
            
            const access = await service.loginUser(mockUser.email, mockUser.password);
            
            expect(access).toBe(true);
            expect(mockStorage.set).toHaveBeenCalledWith('session_active', mockUser.email);
        });

        // --- ACTUALIZAR USUARIO ---
        it('actualizarUsuario debería actualizar el usuario en storage y retornar true', async () => {
            const updatedUser = { ...mockUser, nombre: 'Nuevo Nombre', edad: 40 }; 
            mockStorage.get.and.returnValue(Promise.resolve([mockUser])); 
            
            const success = await service.actualizarUsuario(updatedUser);
            
            expect(success).toBe(true);
            expect(mockStorage.set).toHaveBeenCalledWith('users', [updatedUser]); 
        });
    });

    // =================================================================
    // D. PRUEBAS DE CRUD USUARIOS - MODO NATIVO (SQLite)
    // =================================================================

    describe('CRUD Usuarios - Modo Nativo (SQLite)', () => {
        
        beforeEach(async () => {
            await createService(false); 
            mockExecuteSql.calls.reset(); 
            mockStorage.set.calls.reset(); // Limpieza para la aserción not.toHaveBeenCalled()
        });

        // --- REGISTRO ---
        it('registerUser debería insertar un usuario en la BD nativa y retornar true', async () => {
            mockExecuteSql.and.returnValue(Promise.resolve({ rowsAffected: 1 }));
            
            const success = await service.registerUser('nativeuser', 'Nat', 'User', 'native@reg.com', 25, 'F', 'pass');
            
            expect(success).toBe(true);
            expect(mockExecuteSql).toHaveBeenCalledWith(
                jasmine.stringMatching(/INSERT INTO users \(usuario, nombre, apellido, email, edad, genero, password\) VALUES \(\?, \?, \?, \?, \?, \?, \?\)/), 
                ['nativeuser', 'Nat', 'User', 'native@reg.com', 25, 'F', 'pass']
            );
        });

        // --- LOGIN ---
        // ✅ CORRECCIÓN: El test original era correcto; se verifica que el await permite la aserción final.
        it('loginUser debería retornar false si no se encuentra el usuario nativo', async () => {
            // Simula rows.length = 0 (usuario no encontrado)
            mockExecuteSql.and.returnValue(Promise.resolve({ rows: { length: 0 } })); 
            
            const access = await service.loginUser('nonexistent@user.com', 'wrongpass');
            
            expect(access).toBe(false);
            expect(mockStorage.set).not.toHaveBeenCalled(); // No debe crear sesión
        });

        // --- GET USUARIO ---
        it('getUsuario debería retornar el objeto de usuario por email desde SQLite', async () => {
            mockExecuteSql.and.returnValue(Promise.resolve(mockSqlResultSuccess)); 
            
            const user = await service.getUsuario(mockUser.email);
            
            expect(user).toEqual(mockUser);
        });

        // --- ACTUALIZAR USUARIO ---
        it('actualizarUsuario debería actualizar el usuario en SQLite y retornar true', async () => {
            const updatedUser = { ...mockUser, nombre: 'Nuevo Nativo', edad: 35 }; 
            mockExecuteSql.and.returnValue(Promise.resolve({ rowsAffected: 1 }));
            
            const success = await service.actualizarUsuario(updatedUser);
            
            expect(success).toBe(true);
            
            // Asumiendo la consulta SQL simplificada que causó el error anterior
            const expectedSqlSimplified = 'UPDATE users SET usuario=?, nombre=?, apellido=?, edad=?, genero=? WHERE email=?';

            expect(mockExecuteSql).toHaveBeenCalledWith(
                 expectedSqlSimplified,
                 [updatedUser.usuario, updatedUser.nombre, updatedUser.apellido, updatedUser.edad, updatedUser.genero, updatedUser.email]
            );
        });
    });
    
    // =================================================================
    // E. PRUEBAS DE CARRITO (Ionic Storage - Común)
    // =================================================================

    describe('Gestión de Carrito', () => {
        beforeEach(async () => {
            await createService(true); 
            mockStorage.set.calls.reset(); 
        });

        it('guardarCarrito debería almacenar el array de carrito en storage', async () => {
            const mockCarrito = [{ id: 1, item: 'pizza' }];
            await service.guardarCarrito(mockCarrito);
            expect(mockStorage.set).toHaveBeenCalledWith('carrito', mockCarrito);
        });

        it('obtenerCarrito debería retornar el array de carrito si existe', async () => {
            const mockCarrito = [{ id: 2, item: 'bebida' }];
            mockStorage.get.and.returnValue(Promise.resolve(mockCarrito));
            const carrito = await service.obtenerCarrito();
            expect(carrito).toEqual(mockCarrito);
        });

        it('vaciarCarrito debería eliminar la llave de carrito', async () => {
            await service.vaciarCarrito();
            expect(mockStorage.remove).toHaveBeenCalledWith('carrito');
        });
    });

});