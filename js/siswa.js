// ==========================================
// 1. TAMPILAN DASHBOARD SISWA & PROFIL
// ==========================================
function setupSiswaDashboard(user) {
    const elProfilName = document.getElementById('profil-name');
    if (elProfilName) elProfilName.innerText = user.nama;
    
    const elMenuName = document.getElementById('menu-name');
    if (elMenuName) elMenuName.innerText = user.nama;
    
    // --- KODE BARU: Nama Pendek yang Cerdas ---
    const elSiswaNameShort = document.getElementById('siswa-name-short');
    if (elSiswaNameShort) {
        let namaPendek = 'Siswa';
        if (user.nama) {
            const pecahNama = user.nama.trim().split(' ');
            // PERBAIKAN 4: Jika kata pertama terlalu pendek (misal "M." atau "Tb.") dan ada kata kedua, gabungkan keduanya.
            if (pecahNama[0].length <= 2 && pecahNama.length > 1) {
                namaPendek = `${pecahNama[0]} ${pecahNama[1]}`;
            } else {
                namaPendek = pecahNama[0];
            }
        }
        elSiswaNameShort.innerText = namaPendek;
    }

    const elIdentitasDash = document.getElementById('siswa-identitas-dash');
    if (elIdentitasDash) {
        const kelas = user.kelas || '-';
        const nis = user.nis || '-';
        elIdentitasDash.innerText = `${kelas} | ${nis}`;
    }
    // ------------------------------------------

    const elProfilJurusan = document.getElementById('profil-jurusan');
    if (elProfilJurusan) elProfilJurusan.innerText = `${user.tingkat || "-"} ${user.id_jurusan || "-"}`;
    const elMenuKelas = document.getElementById('menu-kelas');
    if (elMenuKelas) elMenuKelas.innerText = `${user.kelas || "-"} ${user.id_jurusan || "-"}`;
    
    const elInfoNis = document.getElementById('info-nis');
    if (elInfoNis) elInfoNis.innerText = user.nis || "-";
    const elInfoJurusanDetail = document.getElementById('info-jurusan-detail');
    if (elInfoJurusanDetail) elInfoJurusanDetail.innerText = user.id_jurusan || "-";
    
    const elInfoStatus = document.getElementById('info-status');
    if (elInfoStatus) {
        elInfoStatus.innerText = user.status_siswa || "Aktif";
        if (user.status_siswa && user.status_siswa.toLowerCase() !== 'aktif') {
            elInfoStatus.className = "text-[10px] font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full";
        } else {
            elInfoStatus.className = "text-[10px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full";
        }
    }
    
    const elInfoTahun = document.getElementById('info-tahun');
    if (elInfoTahun) {
        if (user.nis && user.nis.length >= 4) {
            elInfoTahun.innerText = user.nis.substring(0, 4);
        } else {
            elInfoTahun.innerText = "-";
        }
    }
    
    updateFotoUI(user.foto_profil);

    const elTanggal = document.getElementById('tanggal-hari-ini');
    if (elTanggal) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        elTanggal.innerText = new Date().toLocaleDateString('id-ID', options);
    }

    switchTabMobile('dashboard');
    
    const container = document.getElementById('app-container');
    if (container) {
        container.classList.remove('desktop-mode');
        container.classList.add('device-frame');
    }

    // Inisialisasi data kontekstual dashboard
    initLiveClock();
    refreshDashboardSmartCard();
    loadJadwalDashboardHariIni();
    loadStatistikKehadiranBulanIni();
    loadPengumumanSiswa();
    
    // --- PANGGIL FUNGSI BARU ---
    terapkanPengaturanDashboardSiswa();
}

async function terapkanPengaturanDashboardSiswa() {
    try {
        let pengaturan = typeof cachedPengaturan !== 'undefined' ? cachedPengaturan : null;
        if (!pengaturan) {
            const { data } = await db.from('tabel_pengaturan').select('*').limit(1).maybeSingle();
            pengaturan = data;
            if (typeof cachedPengaturan !== 'undefined') cachedPengaturan = data;
        }

        const headerHero = document.getElementById('hero-header-siswa');
        const overlay = document.getElementById('hero-overlay');
        
        if (headerHero && pengaturan) {
            const tipeBg = pengaturan.bg_siswa_tipe || 'default';
            
            // 1. Reset class bawaan terlebih dahulu
            headerHero.className = 'text-white pt-6 pb-12 px-4 rounded-b-[2rem] relative overflow-hidden shadow-md w-full max-w-full box-border bg-cover bg-center';
            headerHero.style.backgroundImage = '';

            // 2. Eksekusi sesuai tipe pilihan Admin
            if (tipeBg === 'gambar' && pengaturan.bg_siswa_url) {
                headerHero.style.backgroundImage = `url('${pengaturan.bg_siswa_url}')`;
                
                // --- LOGIKA BARU: CEK STATUS SAKELAR OVERLAY ---
                const pakaiOverlay = pengaturan.bg_siswa_overlay !== false; 
                
                if (overlay) {
                    if (pakaiOverlay) {
                        // Jika ON: Pasang kaca film gelap (Mode Aman)
                        overlay.className = 'absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80 z-0 transition-all';
                    } else {
                        // Jika OFF: Hapus kaca film sepenuhnya (Gambar Murni 100%)
                        overlay.className = 'hidden'; 
                    }
                }
            
            } else if (tipeBg === 'gradasi' && pengaturan.bg_siswa_gradient) {
                // Mode Gradasi Preset Tailwind
                const gradientClasses = ['bg-gradient-to-br', ...pengaturan.bg_siswa_gradient.split(' ')];
                headerHero.classList.add(...gradientClasses);
                // Overlay tipis natural
                if (overlay) overlay.className = 'absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 z-0 transition-all';
            
            } else {
                // Mode Default (Biru - Ungu Bawaan Sistem)
                headerHero.classList.add('bg-gradient-to-br', 'from-blue-600', 'via-indigo-600', 'to-violet-700');
                if (overlay) overlay.className = 'absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-0 transition-all';
            }
        }

        // --- (Kode untuk Tarik Data Quotes Acak biarkan sama seperti sebelumnya) ---
        const quoteEl = document.getElementById('siswa-quote-harian');
        if (quoteEl) {
            const { data: quotesData, error } = await db.from('tabel_quotes').select('kutipan');
            if (!error && quotesData && quotesData.length > 0) {
                const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
                const index = dayOfYear % quotesData.length;
                quoteEl.innerText = quotesData[index].kutipan;
            } else {
                quoteEl.innerText = "Semangat selalu untuk hari ini!";
            }
        }
    } catch (e) {
        console.error("Gagal menerapkan pengaturan dashboard siswa:", e);
    }
}

// Perbarui Fungsi updateFotoUI agar otomatis menyembunyikan icon kamera saat login
function updateFotoUI(url) {
    const dImg = document.getElementById('dashboard-foto');
    const dIco = document.getElementById('dashboard-icon');
    const pImg = document.getElementById('profil-foto-preview');
    const pIco = document.getElementById('profil-icon');
    const mImg = document.getElementById('menu-foto');
    const mIco = document.getElementById('menu-icon');
    const pCam = document.getElementById('camera-badge-icon'); 
    
    if (url && url.trim() !== '') {
        if (dImg) { dImg.style.display = 'block'; dImg.src = url; dImg.classList.remove('hidden'); }
        if (dIco) { dIco.style.display = 'none'; dIco.classList.add('hidden'); }
        
        if (pImg) { pImg.style.display = 'block'; pImg.src = url; pImg.classList.remove('hidden'); }
        if (pIco) { pIco.style.display = 'none'; pIco.classList.add('hidden'); }
        
        if (mImg) { mImg.style.display = 'block'; mImg.src = url; mImg.classList.remove('hidden'); }
        if (mIco) { mIco.style.display = 'none'; mIco.classList.add('hidden'); }

        // Hilangkan ikon kamera biru karena siswa sudah punya foto profil dari database
        if (pCam) { pCam.style.display = 'none'; pCam.classList.add('hidden'); }
    } else {
        if (dImg) { dImg.style.display = 'none'; dImg.classList.add('hidden'); }
        if (dIco) { dIco.style.display = 'block'; dIco.classList.remove('hidden'); }
        
        if (pImg) { pImg.style.display = 'none'; pImg.classList.add('hidden'); }
        if (pIco) { pIco.style.display = 'block'; pIco.classList.remove('hidden'); }
        
        if (mImg) { mImg.style.display = 'none'; mImg.classList.add('hidden'); }
        if (mIco) { mIco.style.display = 'block'; mIco.classList.remove('hidden'); }

        // Munculkan ikon kamera biru jika siswa belum punya foto profil sama sekali
        if (pCam) { pCam.style.display = 'flex'; pCam.classList.remove('hidden'); }
    }
}

function switchTabMobile(tabId) {
    ['tab-dashboard', 'tab-histori', 'tab-izin', 'tab-profil', 'tab-menu', 'tab-pengumuman', 'tab-jadwal', 'tab-pengaturan-siswa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) activeTab.classList.remove('hidden');
    
    ['nav-dashboard', 'nav-histori', 'nav-izin', 'nav-menu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active-nav');
            el.classList.remove('text-teal-600', 'text-gray-400'); 
        }
    });
    
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.classList.add('active-nav');
    }

    if (tabId === 'histori') loadHistoriSiswa();
    if (tabId === 'izin') loadIzinSiswa();
    if (tabId === 'pengumuman') loadPengumumanSiswa();
    if (tabId === 'jadwal') initJadwalSiswa();
    if (tabId === 'pengaturan-siswa') syncPengaturanToggles();
    if (tabId === 'profil') {
        loadProfilForm();
        const form = document.getElementById('form-edit-profil');
        const icon = document.getElementById('icon-toggle-profil');
        if (form && !form.classList.contains('hidden')) {
            form.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
}

function toggleEditProfil() {
    const form = document.getElementById('form-edit-profil');
    const icon = document.getElementById('icon-toggle-profil');
    const stickyBtnContainer = document.getElementById('sticky-btn-simpan-container'); // Ambil referensi kontainer tombol

    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        icon.style.transform = 'rotate(90deg)';
        
        // Tampilkan tombol simpan global saat menu Data Pribadi dibuka
        if (stickyBtnContainer) stickyBtnContainer.classList.remove('hidden');
        
        setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } else {
        form.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
        
        // Sembunyikan tombol simpan JIKA tidak ada foto baru yang sedang mengantre di memori
        if (stickyBtnContainer && !window.fileFotoTerpilih) {
             stickyBtnContainer.classList.add('hidden');
        }
    }
}

function loadProfilForm() {
    if (!currentUser) return;
    document.getElementById('edit-tempat-lahir').value = currentUser.tempat_lahir || '';
    document.getElementById('edit-tgl-lahir').value = currentUser.tgl_lahir || '';
    document.getElementById('edit-foto').value = currentUser.foto_profil || '';
    document.getElementById('edit-nohp').value = currentUser.no_hp || '';
    document.getElementById('edit-alamat').value = currentUser.alamat || '';
    document.getElementById('edit-password-siswa').value = ''; 
}

// 3. Fungsi eksekusi utama saat tombol "Simpan Perubahan" diklik
async function simpanProfilSiswa() {
    // Arahkan ke ID tombol yang baru
    const btn = document.getElementById('btn-simpan-profil-global'); 
    const tempat = document.getElementById('edit-tempat-lahir').value.trim();
    const tgl = document.getElementById('edit-tgl-lahir').value;
    const nohp = document.getElementById('edit-nohp').value.trim();
    const alamat = document.getElementById('edit-alamat').value.trim();
    const passBaru = document.getElementById('edit-password-siswa').value.trim();
    
    // Ganti teks tombol saat proses loading berjalan
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        let publicUrlFoto = document.getElementById('edit-foto').value || '';

        if (window.fileFotoTerpilih) {
            const statusEl = document.getElementById('foto-upload-status');
            if (statusEl) statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah foto ke Cloud...';

            const fileExt = window.fileFotoTerpilih.name.split('.').pop();
            const fileName = `profil_${currentUser.nis}_${Date.now()}.${fileExt}`;
            
            publicUrlFoto = await uploadFileToSupabase(window.fileFotoTerpilih, 'foto_profil', fileName);
            document.getElementById('edit-foto').value = publicUrlFoto;
            window.fileFotoTerpilih = null; 
        }

        // --- (Proses Database, Update Sesi, Update UI tetap sama persis seperti sebelumnya) ---
        let dataUpdate = { 
            tempat_lahir: tempat, 
            tgl_lahir: tgl, 
            no_hp: nohp, 
            alamat: alamat 
        };
        
        if (publicUrlFoto !== '') dataUpdate.foto_profil = publicUrlFoto;
        if (passBaru !== '') dataUpdate.password = passBaru;
        
        const { error } = await db.from('tabel_siswa').update(dataUpdate).eq('nis', currentUser.nis);
        if (error) throw error;

        currentUser.tempat_lahir = tempat;
        currentUser.tgl_lahir = tgl;
        currentUser.no_hp = nohp;
        currentUser.alamat = alamat;
        if (publicUrlFoto !== '') currentUser.foto_profil = publicUrlFoto;
        if (passBaru !== '') currentUser.password = passBaru;

        updateFotoUI(publicUrlFoto);
        
        showToast('Profil berhasil diperbarui!');
        document.getElementById('edit-password-siswa').value = ''; 
        
        const statusEl = document.getElementById('foto-upload-status');
        if (statusEl) statusEl.classList.add('hidden');
        
        // Sembunyikan Menu Edit & Tombol Simpan Setelah Berhasil
        const form = document.getElementById('form-edit-profil');
        if (form && !form.classList.contains('hidden')) {
            toggleEditProfil();
        }
        
        // Sembunyikan kontainer tombol simpan kembali
        const stickyBtnContainer = document.getElementById('sticky-btn-simpan-container');
        if (stickyBtnContainer) stickyBtnContainer.classList.add('hidden');

    } catch (error) {
        // ... (Bagian catch/error handling tetap sama) ...
        showToast('Gagal menyimpan profil!', true);
        console.error("Error Simpan Profil:", error);
    } finally {
        // Kembalikan keadaan awal tombol
        btn.innerHTML = '<i class="fas fa-save"></i> Simpan Semua Perubahan';
        btn.disabled = false;
    }
}


// 1. Variabel global agar foto tersimpan di memori HP sementara
window.fileFotoTerpilih = null;

// 2. Fungsi ini menangkap foto sesaat setelah dipilih dari galeri HP
function handleFotoDipilih(event) {
    const file = event.target.files[0];
    if (!file) return;

    window.fileFotoTerpilih = file;
    const objectUrl = URL.createObjectURL(file);

    const pImg = document.getElementById('profil-foto-preview');
    const pIco = document.getElementById('profil-icon');
    const pCam = document.getElementById('camera-badge-icon');
    
    if (pImg) {
        pImg.src = objectUrl;
        pImg.style.display = 'block';
        pImg.classList.remove('hidden');
    }
    if (pIco) {
        pIco.style.display = 'none';
        pIco.classList.add('hidden');
    }
    if (pCam) {
        pCam.style.display = 'none';
        pCam.classList.add('hidden');
    }

    // TAMPILKAN TOMBOL SIMPAN GLOBAL SAAT FOTO DIPILIH
    const stickyBtnContainer = document.getElementById('sticky-btn-simpan-container');
    if (stickyBtnContainer) stickyBtnContainer.classList.remove('hidden');

    const statusEl = document.getElementById('foto-upload-status');
    if (statusEl) {
         statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Foto siap. Gulir ke bawah dan klik "Simpan Semua Perubahan".';
         statusEl.className = 'text-[10px] text-teal-600 mt-2 font-bold block text-center';
         statusEl.classList.remove('hidden');
    }
}

function toggleEditProfil() {
    const form = document.getElementById('form-edit-profil');
    const icon = document.getElementById('icon-toggle-profil');
    const stickyBtnContainer = document.getElementById('sticky-btn-simpan-container'); // Ambil referensi kontainer tombol

    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        icon.style.transform = 'rotate(90deg)';
        
        // Tampilkan tombol simpan global saat menu Data Pribadi dibuka
        if (stickyBtnContainer) stickyBtnContainer.classList.remove('hidden');
        
        setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } else {
        form.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
        
        // Sembunyikan tombol simpan JIKA tidak ada foto baru yang sedang mengantre di memori
        if (stickyBtnContainer && !window.fileFotoTerpilih) {
             stickyBtnContainer.classList.add('hidden');
        }
    }
}

async function simpanProfilSiswa() {
    // Arahkan ke ID tombol yang baru
    const btn = document.getElementById('btn-simpan-profil-global'); 
    const tempat = document.getElementById('edit-tempat-lahir').value.trim();
    const tgl = document.getElementById('edit-tgl-lahir').value;
    const nohp = document.getElementById('edit-nohp').value.trim();
    const alamat = document.getElementById('edit-alamat').value.trim();
    const passBaru = document.getElementById('edit-password-siswa').value.trim();
    
    // Ganti teks tombol saat proses loading berjalan
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        let publicUrlFoto = document.getElementById('edit-foto').value || '';

        if (window.fileFotoTerpilih) {
            const statusEl = document.getElementById('foto-upload-status');
            if (statusEl) statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah foto ke Cloud...';

            const fileExt = window.fileFotoTerpilih.name.split('.').pop();
            const fileName = `profil_${currentUser.nis}_${Date.now()}.${fileExt}`;
            
            publicUrlFoto = await uploadFileToSupabase(window.fileFotoTerpilih, 'foto_profil', fileName);
            document.getElementById('edit-foto').value = publicUrlFoto;
            window.fileFotoTerpilih = null; 
        }

        // --- (Proses Database, Update Sesi, Update UI tetap sama persis seperti sebelumnya) ---
        let dataUpdate = { 
            tempat_lahir: tempat, 
            tgl_lahir: tgl, 
            no_hp: nohp, 
            alamat: alamat 
        };
        
        if (publicUrlFoto !== '') dataUpdate.foto_profil = publicUrlFoto;
        if (passBaru !== '') dataUpdate.password = passBaru;
        
        const { error } = await db.from('tabel_siswa').update(dataUpdate).eq('nis', currentUser.nis);
        if (error) throw error;

        currentUser.tempat_lahir = tempat;
        currentUser.tgl_lahir = tgl;
        currentUser.no_hp = nohp;
        currentUser.alamat = alamat;
        if (publicUrlFoto !== '') currentUser.foto_profil = publicUrlFoto;
        if (passBaru !== '') currentUser.password = passBaru;

        updateFotoUI(publicUrlFoto);
        
        showToast('Profil berhasil diperbarui!');
        document.getElementById('edit-password-siswa').value = ''; 
        
        const statusEl = document.getElementById('foto-upload-status');
        if (statusEl) statusEl.classList.add('hidden');
        
        // Sembunyikan Menu Edit & Tombol Simpan Setelah Berhasil
        const form = document.getElementById('form-edit-profil');
        if (form && !form.classList.contains('hidden')) {
            toggleEditProfil();
        }
        
        // Sembunyikan kontainer tombol simpan kembali
        const stickyBtnContainer = document.getElementById('sticky-btn-simpan-container');
        if (stickyBtnContainer) stickyBtnContainer.classList.add('hidden');

    } catch (error) {
        // ... (Bagian catch/error handling tetap sama) ...
        showToast('Gagal menyimpan profil!', true);
        console.error("Error Simpan Profil:", error);
    } finally {
        // Kembalikan keadaan awal tombol
        btn.innerHTML = '<i class="fas fa-save"></i> Simpan Semua Perubahan';
        btn.disabled = false;
    }
}

// ==========================================
// 2. PENGAJUAN IZIN & RIWAYAT PRESENSI SISWA
// ==========================================

const izinLampiranFileEl = document.getElementById('izin-lampiran-file');
if (izinLampiranFileEl) {
    izinLampiranFileEl.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file || !currentUser) return;
        
        const statusEl = document.getElementById('lampiran-upload-status');
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah...';
        statusEl.className = 'text-[10px] text-teal-600 mt-1 font-bold';

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `lampiran_${currentUser.nis}_${Date.now()}.${fileExt}`;
            const publicUrl = await uploadFileToSupabase(file, 'lampiran_izin', fileName);
            
            document.getElementById('izin-lampiran').value = publicUrl;
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Berhasil diunggah';
            statusEl.className = 'text-[10px] text-green-600 mt-1 font-bold';
        } catch (error) {
            let errorMsg = 'Gagal unggah file.';
            if (error.message && error.message.includes('row-level security')) {
               errorMsg = 'Akses ditolak. Cek RLS Policy Storage.';
            }
            statusEl.innerHTML = `<i class="fas fa-times-circle"></i> ${errorMsg}`;
            statusEl.className = 'text-[10px] text-red-500 mt-1 font-bold';
            document.getElementById('izin-lampiran').value = '';
            console.error(error);
        }
    });
}

async function submitIzin() {
    if (!currentUser) return;
    const jenis = document.getElementById('izin-jenis').value;
    const ket = document.getElementById('izin-keterangan').value.trim();
    const lampiran = document.getElementById('izin-lampiran').value.trim();
    const tglPengajuan = document.getElementById('izin-tgl-input').value; 
    const btn = document.getElementById('btn-submit-izin');

    if (!ket) return showToast('Keterangan tidak boleh kosong!', true);
    if (!tglPengajuan) return showToast('Tanggal pengajuan belum diisi!', true);

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    btn.disabled = true;

    try {
        const { error } = await db.from('tabel_izin').insert([{
            nis: currentUser.nis,
            nama: currentUser.nama,
            tanggal: tglPengajuan,
            jenis: jenis,
            keterangan: ket,
            lampiran: lampiran,
            status: 'Menunggu'
        }]);
        
        if (error) throw error;
        
        showToast('Pengajuan berhasil dikirim!');
        document.getElementById('izin-keterangan').value = '';
        document.getElementById('izin-lampiran-file').value = '';
        document.getElementById('izin-lampiran').value = '';
        document.getElementById('lampiran-upload-status').innerText = '';
        
        loadIzinSiswa(); 

    } catch (error) {
        showToast('Gagal mengirim pengajuan.', true);
        console.error(error);
    } finally {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pengajuan';
        btn.disabled = false;
    }
}

async function loadIzinSiswa() {
    if (!currentUser) return;
    const container = document.getElementById('izin-list');
    container.innerHTML = '<p class="text-center text-xs text-teal-600 mt-4"><i class="fas fa-spinner fa-spin"></i> Memuat data...</p>';
    
    const { data, error } = await db.from('tabel_izin').select('*').eq('nis', currentUser.nis).order('id', { ascending: false }).limit(10);
    
    if (error || !data || data.length === 0) {
        container.innerHTML = '<p class="text-center text-xs text-gray-400 mt-4">Belum ada pengajuan izin/sakit.</p>';
        return;
    }

    container.innerHTML = '';
    data.forEach(izin => {
        const statusColor = izin.status === 'Disetujui' ? 'bg-green-100 text-green-700 border-green-200' : (izin.status === 'Ditolak' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200');        
        let icon = 'fa-envelope-open-text';
            if (izin.jenis === 'Sakit') icon = 'fa-notes-medical';
            else if (izin.jenis.includes('Lupa Absen')) icon = 'fa-user-clock'; // Ikon khusus lupa absen
        const lampiranIcon = izin.lampiran ? `<br><a href="${izin.lampiran}" target="_blank" class="text-blue-500 hover:underline text-[10px]"><i class="fas fa-paperclip"></i> Bukti Lampiran</a>` : '';
        
        container.innerHTML += `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-bold text-sm text-gray-800">${izin.jenis}</h4>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor}">${izin.status}</span>
                    </div>
                    <p class="text-[10px] text-gray-400 mb-1"><i class="far fa-calendar-alt"></i> ${izin.tanggal}</p>
                    <p class="text-xs text-gray-600 line-clamp-2">${izin.keterangan} ${lampiranIcon}</p>
                </div>
            </div>
        `;
    });
}

async function loadHistoriSiswa() {
    if (!currentUser || currentUser.role !== 'siswa') return;
    const container = document.getElementById('histori-list');
    container.innerHTML = '<p class="text-center text-xs text-teal-600 mt-6"><i class="fas fa-spinner fa-spin"></i> Menarik riwayat dari Cloud...</p>';
    
    const { data, error } = await db.from('tabel_presensi')
                                    .select('*')
                                    .eq('nis', currentUser.nis)
                                    .order('id', { ascending: false })
                                    .limit(30);
    
    if (error || !data || data.length === 0) {
        container.innerHTML = '<p class="text-center text-sm text-gray-400 mt-8">Belum ada riwayat absensi.</p>';
        return;
    }

    container.innerHTML = '';
    data.forEach(log => {
        const el = document.createElement('div');
        el.className = "bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center";
        const inTime = log.jam_masuk ? log.jam_masuk : '-';
        const outTime = log.jam_pulang ? log.jam_pulang : '-';
        el.innerHTML = `
            <div>
                <h3 class="font-bold text-gray-800 text-sm mb-1">${log.tanggal}</h3>
                <p class="text-[11px] text-gray-500">Masuk: <span class="font-bold text-gray-700">${inTime}</span> | Pulang: <span class="font-bold text-gray-700">${outTime}</span></p>
            </div>
            <span class="bg-green-100 text-green-700 border-green-200 px-3 py-1 rounded-full text-[10px] font-bold border"><i class="fas fa-check"></i> Cloud</span>
        `;
        container.appendChild(el);
    });
}

// ==========================================
// 3. SCANNER, KAMERA, PREVIEW & PROSES ABSENSI
// ==========================================

let currentAbsenType = 'masuk';
let cameraStream = null;
let currentCapturedBlob = null;

async function startCamera() {
    const videoElement = document.getElementById('camera-feed');
    const scanTitle = document.getElementById('scan-title');
    const scanText = document.getElementById('scan-text');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" },
            audio: false 
        });
        
        videoElement.srcObject = cameraStream;
        videoElement.classList.remove('hidden'); 
        scanTitle.innerText = "Posisikan Wajah";
        scanText.innerText = "Kamera Aktif & Siap Jepret";
        scanText.className = "text-green-400 font-semibold text-sm";
    } catch (err) {
        console.error("Gagal akses kamera:", err);
        scanTitle.innerText = "Kamera Tidak Tersedia";
        scanText.innerText = "Pastikan izin kamera browser aktif.";
        scanText.className = "text-rose-400 font-semibold text-sm";
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    const videoElement = document.getElementById('camera-feed');
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.classList.add('hidden');
    }
}

async function openScanner(type) {
    // ========================================================
    // 1. PINTU DEPAN: DETEKSI ANTI-CHEAT (MANIPULASI WAKTU)
    // ========================================================
    try {
        const waktuServer = await getServerTime(); 
        const waktuLokal = new Date();
        const selisihMenit = Math.abs((waktuServer - waktuLokal) / (1000 * 60));
        
        // Jika selisih lebih dari 3 menit, langsung TENDANG!
        if (selisihMenit > 3) {
            showToast('⚠️ Peringatan: Mohon aktifkan "Waktu Otomatis" di pengaturan telepon Anda!', true);
            
            // Catat ke log kecurangan di database
            try {
                await db.from('tabel_log_kecurangan').insert([{
                    nis: currentUser.nis,
                    nama: currentUser.nama,
                    kelas: currentUser.kelas || '-',
                    aktivitas: `Mencoba buka scanner absen ${type} dengan manipulasi jam`,
                    waktu_lokal_hp: waktuLokal.toLocaleString('id-ID')
                }]);
            } catch (logErr) {
                console.error("Gagal mengirim log kecurangan:", logErr);
            }
            
            // Hentikan fungsi di sini, jangan biarkan aplikasi mengecek jadwal!
            return; 
        }
    } catch (e) {
        return showToast('⚠️ Verifikasi waktu gagal. Pastikan internet stabil.', true);
    }
    // ========================================================


    // ========================================================
    // 2. PENGECEKAN JADWAL BAWAAN (Hanya jalan jika Anti-Cheat aman)
    // ========================================================
    try {
        const { data } = await db.from('tabel_pengaturan').select('*').limit(1).maybeSingle();
        if (data) cachedPengaturan = data;
    } catch (e) { 
        console.log("Lanjut tanpa pengaturan cloud", e);
    }

    if (cachedPengaturan) {
        const now = await getServerTime();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentJam = `${currentHours}:${currentMinutes}`;
        
        if (type === 'masuk') {
            if (cachedPengaturan.jam_masuk_mulai && currentJam < cachedPengaturan.jam_masuk_mulai) {
                return showToast(`Gagal: Absen masuk baru dibuka pukul ${cachedPengaturan.jam_masuk_mulai} WIB`, true);
            }
            if (cachedPengaturan.jam_masuk_akhir && currentJam > cachedPengaturan.jam_masuk_akhir) {
                return showToast(`Gagal: Absen masuk sudah ditutup sejak pukul ${cachedPengaturan.jam_masuk_akhir} WIB`, true);
            }
        } else {
            if (cachedPengaturan.jam_pulang_mulai && currentJam < cachedPengaturan.jam_pulang_mulai) {
                return showToast(`Gagal: Waktu pulang belum tiba (Mulai pukul ${cachedPengaturan.jam_pulang_mulai} WIB)`, true);
            }
        }

        if (cachedPengaturan.lokasi_lat && cachedPengaturan.lokasi_lng && cachedPengaturan.radius) {
            showToast('Mengecek lokasi GPS...', false);
            if (!navigator.geolocation) return showToast('Browser tidak mendukung pembacaan GPS!', true);
            
            return navigator.geolocation.getCurrentPosition(
                (position) => {
                    const jarak = hitungJarakGPS(
                        position.coords.latitude, position.coords.longitude,
                        parseFloat(cachedPengaturan.lokasi_lat), parseFloat(cachedPengaturan.lokasi_lng)
                    );
                    
                    const maxRadius = parseFloat(cachedPengaturan.radius);
                    if (jarak > maxRadius) {
                        return showToast(`Gagal: Berada di luar area sekolah! (Jarak: ${Math.round(jarak)}m | Toleransi: ${maxRadius}m)`, true);
                    } else {
                        tampilkanScannerUI(type); 
                    }
                },
                (error) => {
                    let errDetail = 'Gagal membaca GPS.';
                    if (error.code === error.PERMISSION_DENIED) {
                        errDetail = 'Izin lokasi ditolak oleh browser.';
                    } else if (error.code === error.TIMEOUT) {
                        errDetail = 'Waktu pencarian lokasi habis. Coba lagi.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errDetail = 'Sinyal lokasi tidak tersedia.';
                    }
                    showToast(errDetail, true);
                },
                { enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 }
            );
        }
    }
    
    // Jika semua lolos (Waktu aman, Jadwal pas, GPS cocok), baru buka Kamera!
    tampilkanScannerUI(type);
}

async function tampilkanScannerUI(type) {
    currentAbsenType = type;
    currentCapturedBlob = null;

    // KUNCI PERBAIKAN BUG KAMERA: Tarik file scanner.html sebelum memanipulasi isinya!
    if (typeof showScreen === 'function') {
        await showScreen('screen-scanner');
    }

    document.getElementById('lbl-absen-tipe').innerText = type === 'masuk' ? 'Jepret Foto Absen Masuk' : 'Jepret Foto Absen Pulang';
    
    const scanPhoto = document.getElementById('scanner-student-photo');
    const scanIcon = document.getElementById('scanner-student-icon');
    
    if (currentUser && currentUser.foto_profil) {
        scanPhoto.src = currentUser.foto_profil;
        scanPhoto.style.display = 'block'; 
        scanPhoto.classList.remove('hidden');
        scanIcon.classList.add('hidden');
    } else {
        scanPhoto.classList.add('hidden');
        scanIcon.classList.remove('hidden');
    }

    resetUIKeModeJepret();
    startCamera();
}

function closeScanner() {
    stopCamera();
    currentCapturedBlob = null;
    showScreen('screen-mobile'); 
}

// Alur 1: Jepret Foto & Tampilkan Preview
async function handleAmbilFoto() {
    const video = document.getElementById('camera-feed');
    if (!video || video.classList.contains('hidden') || !cameraStream) {
        showToast('Kamera belum aktif!', true);
        return;
    }

    try {
        const canvas = document.createElement('canvas');
        const targetWidth = 400;
        const ratio = (video.videoWidth || 4) / (video.videoHeight || 3);
        const targetHeight = targetWidth / ratio;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        const res = await fetch(dataUrl);
        currentCapturedBlob = await res.blob();

        // Tampilkan gambar pratinjau di layar frame hexagon
        const imgPreview = document.getElementById('camera-preview-captured');
        imgPreview.src = dataUrl;
        imgPreview.classList.remove('hidden');

        // Sembunyikan video live dan hentikan stream agar hemat baterai
        video.classList.add('hidden');
        stopCamera();

        // Sembunyikan animasi laser saat pratinjau
        const laser = document.getElementById('scan-laser-line');
        if (laser) laser.classList.add('hidden');

        // Alihkan tombol ke Mode Konfirmasi (Ulangi / Kirim)
        document.getElementById('wrap-btn-capture').classList.add('hidden');
        document.getElementById('wrap-btn-confirm').classList.remove('hidden');
        document.getElementById('wrap-btn-confirm').classList.add('flex');

        document.getElementById('scan-title').innerText = "Pratinjau Foto";
        document.getElementById('scan-text').innerText = "Apakah foto sudah jelas?";
        document.getElementById('scan-text').className = "text-amber-300 font-semibold text-sm";

    } catch (e) {
        console.error("Gagal mengambil foto:", e);
        showToast('Gagal memproses jepretan foto.', true);
    }
}

// Alur 2: Ulangi Foto (Mengaktifkan kembali kamera live)
function handleUlangiFoto() {
    currentCapturedBlob = null;
    resetUIKeModeJepret();
    startCamera();
}

function resetUIKeModeJepret() {
    const imgPreview = document.getElementById('camera-preview-captured');
    if (imgPreview) {
        imgPreview.src = '';
        imgPreview.classList.add('hidden');
    }

    const laser = document.getElementById('scan-laser-line');
    if (laser) laser.classList.remove('hidden');

    document.getElementById('wrap-btn-confirm').classList.add('hidden');
    document.getElementById('wrap-btn-confirm').classList.remove('flex');
    
    document.getElementById('wrap-btn-capture').classList.remove('hidden');
    document.getElementById('wrap-btn-capture').classList.add('flex');

    document.getElementById('scan-title').innerText = "Posisikan Wajah";
    document.getElementById('scan-text').innerText = "Kamera Aktif & Siap Jepret";
    document.getElementById('scan-text').className = "text-green-400 font-semibold text-sm";
}

// Alur 3: Kirim Foto ke Cloud Supabase (Lebih Bersih & Efisien)
async function processAbsenToCloud() {
    const btnSubmit = document.getElementById('btn-submit-absen');
    const btnRetake = document.getElementById('btn-retake-photo');
    
    // Kunci tombol langsung agar siswa tidak spam klik
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyiapkan Data...';
    btnSubmit.disabled = true;
    btnRetake.disabled = true;

    let dateObj;

    // --- CUKUP AMBIL WAKTU SERVER (Tanpa perlu deteksi selisih lagi di sini) ---
    try {
        dateObj = await getServerTime(); 
    } catch (e) {
        // Blokir jika tiba-tiba internet mati saat mau kirim foto
        showToast('⚠️ Gagal terhubung ke server waktu. Pastikan internet stabil.', true);
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Presensi';
        btnSubmit.disabled = false;
        btnRetake.disabled = false;
        return; 
    }
    // --------------------------------------------------------------------------

    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim Data...';
    
    // Ekstrak tanggal dari dateObj (Waktu Server Asli)
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const tglHariIni = `${yyyy}-${mm}-${dd}`; 
    const jamSekarang = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
        let urlFotoBukti = null;
        if (currentCapturedBlob) {
            try {
                const fileName = `absen_${currentUser.nis}_${Date.now()}.jpg`;
                urlFotoBukti = await uploadFileToSupabase(currentCapturedBlob, 'bukti_absen', fileName);
            } catch (e) {
                console.error("Upload foto bukti gagal, lanjut absen tanpa foto:", e);
            }
        }

        const { data: existData, error: errCek } = await db.from('tabel_presensi')
            .select('*')
            .eq('nis', currentUser.nis)
            .eq('tanggal', tglHariIni)
            .maybeSingle();

        if (currentAbsenType === 'masuk') {
            if (existData && existData.jam_masuk) {
                showToast('Anda sudah absen masuk hari ini!', true);
            } else if (existData && !existData.jam_masuk) {
                showToast('Gagal: Waktu absen masuk sudah terlewat.', true);
            } else {
                const payload = {
                    nis: currentUser.nis,
                    nama: currentUser.nama,
                    kelas: currentUser.kelas || '-',
                    tanggal: tglHariIni,
                    jam_masuk: jamSekarang,
                    status_masuk: 'Hadir'
                };
                if (urlFotoBukti) payload.foto_masuk = urlFotoBukti;

                const { error } = await db.from('tabel_presensi').insert([payload]);
                if (error) throw error;
                playBeepSuccess();
                triggerHapticSuccess();
                showToast('Absen Masuk Berhasil!');
            }
        } else { 
            // ALUR ABSEN PULANG
            if (existData && existData.jam_pulang) {
                showToast('Anda sudah absen pulang hari ini!', true);
            } else if (existData && !existData.jam_pulang) {
                const payload = { jam_pulang: jamSekarang, status_pulang: 'Hadir' };
                if (urlFotoBukti) payload.foto_pulang = urlFotoBukti;

                const { error } = await db.from('tabel_presensi').update(payload).eq('id', existData.id); 
                if (error) throw error;
                playBeepSuccess();
                triggerHapticSuccess();
                showToast('Absen Pulang Berhasil!');
            } else if (!existData) {
                const payload = {
                    nis: currentUser.nis,
                    nama: currentUser.nama,
                    kelas: currentUser.kelas || '-',
                    tanggal: tglHariIni,
                    jam_pulang: jamSekarang,
                    status_pulang: 'Hadir'
                };
                if (urlFotoBukti) payload.foto_pulang = urlFotoBukti;

                const { error } = await db.from('tabel_presensi').insert([payload]);
                if (error) throw error;
                
                playBeepSuccess();
                triggerHapticSuccess();
                showToast('Absen Pulang Berhasil (Tanpa absen masuk)!');
            }
        }
    } catch (err) {
        console.error(err);
        showToast(`Gagal: ${err.message || 'Terjadi kesalahan jaringan.'}`, true);
    } finally {
        closeScanner();

        if (typeof refreshDashboardSmartCard === 'function') refreshDashboardSmartCard();
        if (typeof loadStatistikKehadiranBulanIni === 'function') loadStatistikKehadiranBulanIni();

        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Presensi';
        btnSubmit.disabled = false;
        btnRetake.disabled = false;
    }
}

// ==========================================
// 4. SMART FAB (TOMBOL TENGAH OTOMATIS)
// ==========================================
async function triggerAbsenFAB() {
    if (!currentUser || currentUser.role !== 'siswa') return;

    showToast('Memeriksa status kehadiran hari ini...');

    const dateObj = await getServerTime();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const tglHariIni = `${yyyy}-${mm}-${dd}`;

    try {
        // Ambil pengaturan cloud untuk batas jam (jika ada)
        let batasAkhirMasuk = "12:00"; // default fallback jika cloud gagal
        try {
            const { data: peng } = await db.from('tabel_pengaturan').select('jam_masuk_akhir').limit(1).maybeSingle();
            if (peng && peng.jam_masuk_akhir) batasAkhirMasuk = peng.jam_masuk_akhir;
        } catch (e) { }

        const jamSekarang = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');

        const { data: existData } = await db.from('tabel_presensi')
            .select('*')
            .eq('nis', currentUser.nis)
            .eq('tanggal', tglHariIni)
            .maybeSingle();

        // KONDISI 1: Belum ada data absen sama sekali hari ini
        if (!existData) {
            // Cek apakah ini masih pagi atau sudah sore
            if (jamSekarang > batasAkhirMasuk) {
                // Sudah lewat jam masuk, paksa buka absen PULANG
                openScanner('pulang');
            } else {
                // Masih pagi, buka absen MASUK
                openScanner('masuk');
            }
        }
        // KONDISI 2: Sudah absen masuk (atau ada baris data), tetapi belum absen pulang
        else if (!existData.jam_pulang) {
            openScanner('pulang');
        } 
        // KONDISI 3: Data masuk dan pulang sudah terisi
        else {
            showToast('Presensi Anda hari ini sudah tuntas. Terima kasih!', false);
        }
    } catch (err) {
        console.error("Gagal memeriksa status FAB:", err);
        openScanner('masuk'); // Fallback aman
    }
}


// ==========================================
// 5. FITUR PENGUMUMAN SEKOLAH (SISWA)
// ==========================================

async function loadPengumumanSiswa() {
    if (!currentUser || currentUser.role !== 'siswa') return;

    const container = document.getElementById('pengumuman-list-container');
    const badgeDash = document.getElementById('badge-pengumuman-dashboard');
    const badgeMenu = document.getElementById('badge-pengumuman-menu');
    const previewDash = document.getElementById('preview-pengumuman-dashboard');

    if (container) {
        container.innerHTML = '<p class="text-center text-xs text-teal-600 py-10 font-medium"><i class="fas fa-spinner fa-spin mr-1"></i> Mengambil pengumuman terbaru...</p>';
    }

    try {
        // Ambil pengumuman yang ditujukan untuk semua siswa (ALL) atau spesifik untuk kelas siswa ini
        const { data, error } = await db.from('tabel_pengumuman')
            .select('*')
            .or(`target_kelas.eq.ALL,target_kelas.eq.${currentUser.kelas}`)
            .order('id', { ascending: false });

        if (error) throw error;

        const total = data ? data.length : 0;
        if (badgeDash) badgeDash.innerText = total;
        if (badgeMenu) badgeMenu.innerText = total;

        // Perbarui cuplikan ringkas di kartu beranda/dashboard
        if (previewDash) {
            if (total > 0) {
                previewDash.innerText = `${data[0].judul} - ${data[0].isi}`;
            } else {
                previewDash.innerText = 'Belum ada pengumuman terbaru hari ini.';
            }
        }

        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm mt-4">
                    <div class="w-16 h-16 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center text-2xl mb-3">
                        <i class="far fa-bell-slash"></i>
                    </div>
                    <h3 class="font-bold text-sm text-gray-700">Belum Ada Pengumuman</h3>
                    <p class="text-xs text-gray-400 mt-1">Saat ini belum ada informasi baru yang dibagikan.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        data.forEach(item => {
            // Tentukan gaya badge kategori
            let badgeStyle = 'bg-blue-50 text-blue-600 border-blue-200';
            let iconKat = 'fa-info-circle';
            
            if (item.kategori === 'Penting') {
                badgeStyle = 'bg-rose-50 text-rose-600 border-rose-200';
                iconKat = 'fa-exclamation-triangle';
            } else if (item.kategori === 'Kegiatan') {
                badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                iconKat = 'fa-calendar-star';
            } else if (item.kategori === 'Akademik') {
                badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                iconKat = 'fa-graduation-cap';
            }

            const tglFormatted = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
            }) : 'Hari ini';

            const card = document.createElement('div');
            card.className = "bg-white rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-all";
            card.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}">
                        <i class="fas ${iconKat}"></i> ${item.kategori || 'Informasi'}
                    </span>
                    <span class="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <i class="far fa-clock"></i> ${tglFormatted}
                    </span>
                </div>
                <h3 class="font-extrabold text-gray-800 text-[15px] leading-snug mb-2">${item.judul}</h3>
                <p class="text-xs text-gray-600 leading-relaxed mb-4 whitespace-pre-line">${item.isi}</p>
                <div class="pt-3 border-t border-gray-50 flex justify-between items-center text-[11px] text-gray-400">
                    <span class="flex items-center gap-1.5">
                        <i class="fas fa-user-edit text-teal-600"></i> <strong class="text-gray-600 font-semibold">${item.penulis || 'Admin Sekolah'}</strong>
                    </span>
                    <span class="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                        ${item.target_kelas === 'ALL' ? 'Semua Kelas' : item.target_kelas}
                    </span>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Gagal memuat pengumuman:", err);
        if (container) {
            container.innerHTML = '<p class="text-center text-xs text-red-500 py-6 font-semibold">Gagal memuat pengumuman dari server.</p>';
        }
    }
}


// ==========================================
// 6. FITUR JADWAL PELAJARAN (SISWA)
// ==========================================

let selectedHariJadwal = 'Senin';

function getNamaHariIndo(dateObj) {
    const listHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return listHari[dateObj.getDay()];
}

// Inisialisasi Pill Hari dengan Format Rapi & Ungu Pastel Gradasi
function initJadwalSiswa() {
    const containerPill = document.getElementById('container-pill-hari');
    if (!containerPill) return;

    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; // Hari Senin
    
    const daftarHari = [
        { nama: 'Senin', offset: 0 },
        { nama: 'Selasa', offset: 1 },
        { nama: 'Rabu', offset: 2 },
        { nama: 'Kamis', offset: 3 },
        { nama: 'Jumat', offset: 4 }
    ];

    const todayIndo = getNamaHariIndo(new Date());
    if (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].includes(todayIndo)) {
        selectedHariJadwal = todayIndo;
    } else {
        selectedHariJadwal = 'Senin';
    }

    let html = '';
    daftarHari.forEach(item => {
        const d = new Date(curr.setDate(first + item.offset));
        const tglAngka = d.getDate(); // Contoh: 20
        const tglBulan = d.toLocaleDateString('id-ID', { month: 'short' }); // Contoh: Okt
        const isSelected = selectedHariJadwal === item.nama;

        // Tombol aktif: Ungu Pastel Gradasi Solid
        const btnClass = isSelected 
            ? 'py-2.5 px-1 rounded-2xl text-xs font-bold transition-all bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 flex flex-col items-center justify-center scale-105'
            : 'py-2.5 px-1 rounded-2xl text-xs font-bold transition-all bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 flex flex-col items-center justify-center';

        html += `
            <button onclick="pilihHariJadwal('${item.nama}')" id="pill-hari-${item.nama}" class="pill-jadwal ${btnClass}">
                <span class="text-[11px] font-extrabold leading-tight">${item.nama.substring(0, 3)}</span>
                <span class="text-[10px] font-mono font-bold mt-1 ${isSelected ? 'text-white' : 'text-slate-700'} leading-none">${tglAngka}</span>
                <span class="text-[8px] font-medium mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-400'} uppercase tracking-wider leading-none">${tglBulan}</span>
            </button>
        `;
    });

    containerPill.innerHTML = html;
    loadJadwalSiswa(selectedHariJadwal);
}

function pilihHariJadwal(hari) {
    selectedHariJadwal = hari;

    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1;
    const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    daftarHari.forEach((h, index) => {
        const btn = document.getElementById(`pill-hari-${h}`);
        if (!btn) return;
        const d = new Date(curr.setDate(first + index));
        const tglAngka = d.getDate();
        const tglBulan = d.toLocaleDateString('id-ID', { month: 'short' });
        
        const isSelected = (h === hari);
        const btnClass = isSelected 
            ? 'py-2.5 px-1 rounded-2xl text-xs font-bold transition-all bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 flex flex-col items-center justify-center scale-105'
            : 'py-2.5 px-1 rounded-2xl text-xs font-bold transition-all bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 flex flex-col items-center justify-center';

        btn.className = `pill-jadwal ${btnClass}`;
        btn.innerHTML = `
            <span class="text-[11px] font-extrabold leading-tight">${h.substring(0, 3)}</span>
            <span class="text-[10px] font-mono font-bold mt-1 ${isSelected ? 'text-white' : 'text-slate-700'} leading-none">${tglAngka}</span>
            <span class="text-[8px] font-medium mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-400'} uppercase tracking-wider leading-none">${tglBulan}</span>
        `;
    });

    loadJadwalSiswa(hari);
}

async function loadJadwalSiswa(hari) {
    if (!currentUser || currentUser.role !== 'siswa') return;

    const container = document.getElementById('jadwal-list-container');
    const labelKelas = document.getElementById('jadwal-sub-kelas');
    if (labelKelas) labelKelas.innerText = `Kelas ${currentUser.kelas || '-'}`;

    if (!container) return;
    container.innerHTML = `<p class="text-center text-xs text-purple-600 py-10 font-medium"><i class="fas fa-spinner fa-spin mr-1"></i> Memuat jadwal hari ${hari}...</p>`;

    try {
        const { data, error } = await db.from('tabel_jadwal')
            .select('*')
            .eq('kelas', currentUser.kelas)
            .eq('hari', hari)
            .order('jam_mulai', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm mt-4">
                    <div class="w-16 h-16 rounded-full bg-purple-50 text-purple-400 mx-auto flex items-center justify-center text-2xl mb-3">
                        <i class="far fa-calendar-times"></i>
                    </div>
                    <h3 class="font-bold text-sm text-slate-700">Tidak Ada Jadwal</h3>
                    <p class="text-xs text-slate-400 mt-1">Tidak ada pelajaran yang terdaftar di hari ${hari}.</p>
                </div>
            `;
            return;
        }

        // Variasi Gradasi Pastel Cantik untuk Nomor JP Bulat Sempurna
        const warnaLingkaran = [
            'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-blue-500/30',
            'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/30',
            'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30',
            'bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-purple-500/30',
            'bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-pink-500/30',
            'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-500/30'
        ];

        container.innerHTML = '';
        data.forEach((item, index) => {
            const styleBulat = warnaLingkaran[index % warnaLingkaran.length];
            const nomorJP = index + 1;

            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-3.5 hover:border-purple-200 transition-all";
            card.innerHTML = `
                <div class="w-11 h-11 rounded-full ${styleBulat} font-mono font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md">
                    ${nomorJP}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="text-[11px] font-mono font-semibold text-slate-400">${item.jam_mulai} - ${item.jam_selesai}</span>
                    </div>
                    <h4 class="font-extrabold text-slate-800 text-xs leading-snug truncate" title="${item.mapel}">${item.mapel}</h4>
                    <p class="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        Ruang ${item.ruang || 'Kelas'} • <span class="text-slate-600">${item.guru || 'Guru Pengampu'}</span>
                    </p>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Gagal memuat jadwal:", err);
        container.innerHTML = '<p class="text-center text-xs text-rose-500 py-6 font-semibold">Gagal memuat jadwal dari server.</p>';
    }
}

function pilihHariJadwal(hari) {
    selectedHariJadwal = hari;

    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1;
    const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

    daftarHari.forEach((h, index) => {
        const btn = document.getElementById(`pill-hari-${h}`);
        if (!btn) return;
        const d = new Date(curr.setDate(first + index));
        const tglAngka = d.getDate();
        const tglBulan = d.toLocaleDateString('id-ID', { month: 'short' });
        
        const isSelected = (h === hari);
        const btnClass = isSelected 
            ? 'py-2.5 px-1 rounded-2xl text-xs font-bold transition-all bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 flex flex-col items-center justify-center scale-105'
            : 'py-2.5 px-1 rounded-2xl text-xs font-bold transition-all bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 flex flex-col items-center justify-center';

        btn.className = `pill-jadwal ${btnClass}`;
        btn.innerHTML = `
            <span class="text-[11px] font-extrabold leading-tight">${h.substring(0, 3)}</span>
            <span class="text-[10px] font-mono font-bold mt-1 ${isSelected ? 'text-white' : 'text-slate-700'} leading-none">${tglAngka}</span>
            <span class="text-[8px] font-medium mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-400'} uppercase tracking-wider leading-none">${tglBulan}</span>
        `;
    });

    loadJadwalSiswa(hari);
}

async function loadJadwalSiswa(hari) {
    if (!currentUser || currentUser.role !== 'siswa') return;

    const container = document.getElementById('jadwal-list-container');
    const labelKelas = document.getElementById('jadwal-sub-kelas');
    if (labelKelas) labelKelas.innerText = `Kelas ${currentUser.kelas || '-'}`;

    if (!container) return;
    container.innerHTML = `<p class="text-center text-xs text-purple-600 py-10 font-medium"><i class="fas fa-spinner fa-spin mr-1"></i> Memuat jadwal hari ${hari}...</p>`;

    try {
        const { data, error } = await db.from('tabel_jadwal')
            .select('*')
            .eq('kelas', currentUser.kelas)
            .eq('hari', hari)
            .order('jam_mulai', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm mt-4">
                    <div class="w-16 h-16 rounded-full bg-purple-50 text-purple-400 mx-auto flex items-center justify-center text-2xl mb-3">
                        <i class="far fa-calendar-times"></i>
                    </div>
                    <h3 class="font-bold text-sm text-slate-700">Tidak Ada Jadwal</h3>
                    <p class="text-xs text-slate-400 mt-1">Tidak ada pelajaran yang terdaftar di hari ${hari}.</p>
                </div>
            `;
            return;
        }

        // Variasi Gradasi Pastel Cantik untuk Nomor JP Bulat Sempurna
        const warnaLingkaran = [
            'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-blue-500/30',
            'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/30',
            'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30',
            'bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-purple-500/30',
            'bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-pink-500/30',
            'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-500/30'
        ];

        container.innerHTML = '';
        data.forEach((item, index) => {
            const styleBulat = warnaLingkaran[index % warnaLingkaran.length];
            const nomorJP = index + 1;

            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-3.5 hover:border-purple-200 transition-all";
            card.innerHTML = `
                <div class="w-11 h-11 rounded-full ${styleBulat} font-mono font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md">
                    ${nomorJP}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="text-[11px] font-mono font-semibold text-slate-400">${item.jam_mulai} - ${item.jam_selesai}</span>
                    </div>
                    <h4 class="font-extrabold text-slate-800 text-xs leading-snug truncate" title="${item.mapel}">${item.mapel}</h4>
                    <p class="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        Ruang ${item.ruang || 'Kelas'} • <span class="text-slate-600">${item.guru || 'Guru Pengampu'}</span>
                    </p>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Gagal memuat jadwal:", err);
        container.innerHTML = '<p class="text-center text-xs text-rose-500 py-6 font-semibold">Gagal memuat jadwal dari server.</p>';
    }
}


// ==========================================
// 7. PENGATURAN APLIKASI SISWA
// ==========================================

function syncPengaturanToggles() {
    const isDark = localStorage.getItem('pref_dark_mode') === 'true';
    const isSuara = localStorage.getItem('pref_suara') !== 'false';
    const isVibrasi = localStorage.getItem('pref_vibrasi') !== 'false';

    const tDark = document.getElementById('toggle-dark-mode');
    const tSuara = document.getElementById('toggle-suara-absen');
    const tVib = document.getElementById('toggle-vibrasi-absen');

    if (tDark) tDark.checked = isDark;
    if (tSuara) tSuara.checked = isSuara;
    if (tVib) tVib.checked = isVibrasi;
}

// 1. Pengendali Switch Dark Mode
function handleToggleDarkMode(enabled) {
    localStorage.setItem('pref_dark_mode', enabled);
    const container = document.getElementById('app-container');
    const root = document.documentElement; // tag <html>
    const body = document.body;            // tag <body>

    if (enabled) {
        if (container) container.classList.add('dark-mode-simulated');
        root.classList.add('dark-mode-simulated', 'dark');
        body.classList.add('dark-mode-simulated', 'dark');
        showToast('Mode Gelap diaktifkan');
    } else {
        if (container) container.classList.remove('dark-mode-simulated');
        root.classList.remove('dark-mode-simulated', 'dark');
        body.classList.remove('dark-mode-simulated', 'dark');
        showToast('Mode Terang diaktifkan');
    }
}

// 2. Inisialisasi Otomatis saat Halaman Dibuka di Chrome / Browser Lain
(function initSavedTheme() {
    const isDark = localStorage.getItem('pref_dark_mode') === 'true';
    const toggleEl = document.getElementById('toggle-dark-mode');
    const container = document.getElementById('app-container');
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
        if (container) container.classList.add('dark-mode-simulated');
        root.classList.add('dark-mode-simulated', 'dark');
        body.classList.add('dark-mode-simulated', 'dark');
        if (toggleEl) toggleEl.checked = true;
    }
})();


// Generator suara konfirmasi presensi tanpa file eksternal (Web Audio API)
function playBeepSuccess() {
    if (localStorage.getItem('pref_suara') === 'false') return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        // Nada dua ketuk yang ramah (Success Chime: 587Hz -> 880Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12); // A5

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
        console.log("AudioContext belum diizinkan atau tidak didukung:", e);
    }
}

function triggerHapticSuccess() {
    if (localStorage.getItem('pref_vibrasi') === 'false') return;
    if (navigator.vibrate) {
        // Pola getar presensi berhasil: getar pendek 100ms, jeda 50ms, getar 150ms
        navigator.vibrate([100, 50, 150]);
    }
}

function handleToggleSuara(enabled) {
    localStorage.setItem('pref_suara', enabled);
    if (enabled) playBeepSuccess(); // Tes nada saat diaktifkan
    showToast(enabled ? 'Suara presensi aktif' : 'Suara presensi dimatikan');
}

function handleToggleVibrasi(enabled) {
    localStorage.setItem('pref_vibrasi', enabled);
    if (enabled) triggerHapticSuccess(); // Tes getar saat diaktifkan
    showToast(enabled ? 'Getaran aktif' : 'Getaran dimatikan');
}

function bersihkanCacheAplikasi() {
    // Bersihkan cache pencarian dan filter tanpa menghapus sesi login
    localStorage.removeItem('cached_siswa_search');
    sessionStorage.clear();
    showToast('Cache aplikasi berhasil dibersihkan!');
}

// Inisialisasi preferensi saat pertama kali dimuat
(function initUserPreferences() {
    if (localStorage.getItem('pref_dark_mode') === 'true') {
        const container = document.getElementById('app-container');
        if (container) container.classList.add('dark-mode-simulated');
    }
})();

// ==========================================
// 8. LOGIKA DASHBOARD DINAMIS & KONTEKSTUAL
// ==========================================

let liveClockInterval = null;

function initLiveClock() {
    if (liveClockInterval) clearInterval(liveClockInterval);
    const updateTime = () => {
        const now = new Date();
        const jamStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
        const badgeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
        
        const elClock = document.getElementById('live-clock');
        const elBadge = document.getElementById('live-clock-badge');
        if (elClock) elClock.innerText = jamStr;
        if (elBadge) elBadge.innerText = `${badgeStr} WIB`;
    };
    updateTime();
    liveClockInterval = setInterval(updateTime, 1000);
}

async function refreshDashboardSmartCard() {
    if (!currentUser || currentUser.role !== 'siswa') return;

    const elTitle = document.getElementById('status-card-title');
    const elBadge = document.getElementById('status-badge-state');
    const elDot = document.getElementById('status-pulse-dot');
    const elValMasuk = document.getElementById('status-val-masuk');
    const elSubMasuk = document.getElementById('status-sub-masuk');
    const elValPulang = document.getElementById('status-val-pulang');
    const elSubPulang = document.getElementById('status-sub-pulang');

    if (!elTitle) return;

    const dateObj = await getServerTime();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const tglHariIni = `${yyyy}-${mm}-${dd}`;
    
    // Ambil jam saat ini untuk logika peringatan sore hari
    const jamSekarangNum = dateObj.getHours();

    try {
        const { data: existData } = await db.from('tabel_presensi')
            .select('*')
            .eq('nis', currentUser.nis)
            .eq('tanggal', tglHariIni)
            .maybeSingle();

        // 1. Belum Presensi Sama Sekali
        if (!existData) {
            elTitle.innerText = "Belum Presensi";
            if (elBadge) {
                elBadge.innerText = "Belum Masuk";
                elBadge.className = "text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60";
            }
            if (elDot) elDot.className = "w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping";
            elValMasuk.innerText = "--:--";
            elSubMasuk.innerText = "Belum Absen";
            elValPulang.innerText = "--:--";
            elSubPulang.innerText = "Belum Dibuka";
        }
        // 2. Tuntas (Keduanya Terisi)
        else if (existData.jam_masuk && existData.jam_pulang) {
            elTitle.innerText = "Presensi Selesai";
            if (elBadge) {
                elBadge.innerText = "Tuntas";
                elBadge.className = "text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60";
            }
            if (elDot) elDot.className = "w-2.5 h-2.5 rounded-full bg-indigo-500";
            elValMasuk.innerText = existData.jam_masuk;
            elSubMasuk.innerText = "Hadir";
            elValPulang.innerText = existData.jam_pulang;
            elSubPulang.innerText = "Tuntas";
        }
        // 3. Hanya Absen Masuk atau Hanya Absen Pulang
        else {
            const hasMasuk = !!existData.jam_masuk;
            const hasPulang = !!existData.jam_pulang;

            elValMasuk.innerText = hasMasuk ? existData.jam_masuk : "--:--";
            elSubMasuk.innerText = hasMasuk ? "Tercatat di Server" : "Lupa Absen Masuk";
            
            elValPulang.innerText = hasPulang ? existData.jam_pulang : "--:--";
            elSubPulang.innerText = hasPulang ? "Tercatat di Server" : "Menunggu Kepulangan";

            // Peringatan: Jika sudah lewat jam 16:00 tapi data masih bolong
            if (jamSekarangNum >= 16) {
                elTitle.innerText = "Data Tidak Lengkap";
                if (elBadge) {
                    elBadge.innerText = "Wajib Lapor";
                    elBadge.className = "text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60 animate-pulse";
                }
                if (elDot) elDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
            } else {
                // Jika masih siang dan wajar belum absen pulang
                elTitle.innerText = hasMasuk ? "Hadir di Sekolah" : "Hanya Absen Pulang";
                if (elBadge) {
                    elBadge.innerText = hasMasuk ? "Sudah Masuk" : "Data Bolong";
                    elBadge.className = "text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60";
                }
                if (elDot) elDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500";
            }
        }
    } catch (e) {
        console.error("Gagal refresh smart card status:", e);
    }
}

async function loadJadwalDashboardHariIni() {
    if (!currentUser || currentUser.role !== 'siswa') return;
    const container = document.getElementById('dash-jadwal-next-container');
    if (!container) return;

    const listHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayIndo = listHari[new Date().getDay()];

    if (todayIndo === 'Minggu' || todayIndo === 'Sabtu') {
        container.innerHTML = `
            <div class="flex items-center gap-3 py-1">
                <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                    <i class="fas fa-couch"></i>
                </div>
                <div>
                    <h4 class="font-extrabold text-xs text-gray-800">Hari Libur Sekolah</h4>
                    <p class="text-[10px] text-gray-400">Tidak ada agenda KBM di hari ${todayIndo}.</p>
                </div>
            </div>`;
        return;
    }

    try {
        const { data, error } = await db.from('tabel_jadwal')
            .select('*')
            .eq('kelas', currentUser.kelas)
            .eq('hari', todayIndo)
            .order('jam_mulai', { ascending: true });

        if (error || !data || data.length === 0) {
            container.innerHTML = `
                <div class="flex items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                        <i class="far fa-calendar-check"></i>
                    </div>
                    <div>
                        <h4 class="font-extrabold text-xs text-gray-800">Tidak Ada Jadwal</h4>
                        <p class="text-[10px] text-gray-400">Belum ada jadwal terdaftar untuk hari ${todayIndo}.</p>
                    </div>
                </div>`;
            return;
        }

        // Tampilkan 2 mapel teratas hari ini
        let html = '<div class="space-y-2 pt-1">';
        data.slice(0, 2).forEach(item => {
            html += `
                <div class="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="text-[10px] font-mono font-extrabold bg-white px-2 py-1 rounded-lg border border-gray-200 text-purple-700 shrink-0">
                            ${item.jam_mulai}
                        </span>
                        <div class="min-w-0">
                            <h4 class="font-extrabold text-xs text-gray-800 truncate leading-tight">${item.mapel}</h4>
                            <p class="text-[9px] text-gray-400 font-medium truncate">${item.guru || '-'} • ${item.ruang || 'Kelas'}</p>
                        </div>
                    </div>
                </div>`;
        });
        html += '</div>';
        container.innerHTML = html;

    } catch (e) {
        console.error("Gagal load agenda jadwal hari ini:", e);
        container.innerHTML = '<p class="text-[10px] text-gray-400 py-1">Gagal memuat jadwal hari ini.</p>';
    }
}

async function loadStatistikKehadiranBulanIni() {
    if (!currentUser || currentUser.role !== 'siswa') return;

    const elHadir = document.getElementById('kpi-hadir');
    const elIzin = document.getElementById('kpi-izin');
    const elPersen = document.getElementById('kpi-persen');

    try {
        const dateObj = new Date();
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const prefixBulan = `${yyyy}-${mm}`; // Filter berdasarkan bulan berjalan (YYYY-MM)

        // Hitung total hadir
        const { data: hadirData } = await db.from('tabel_presensi')
            .select('id, tanggal')
            .eq('nis', currentUser.nis)
            .like('tanggal', `${prefixBulan}%`);

        const totalHadir = hadirData ? hadirData.length : 0;

        // Hitung total izin disetujui
        const { data: izinData } = await db.from('tabel_izin')
            .select('id, tanggal')
            .eq('nis', currentUser.nis)
            .eq('status', 'Disetujui')
            .like('tanggal', `${prefixBulan}%`);

        const totalIzin = izinData ? izinData.length : 0;

        const totalHari = totalHadir + totalIzin;
        const persentase = totalHari > 0 ? Math.round((totalHadir / totalHari) * 100) : 100;

        if (elHadir) elHadir.innerText = totalHadir;
        if (elIzin) elIzin.innerText = totalIzin;
        if (elPersen) elPersen.innerText = `${persentase}%`;

        // --- PERBAIKAN: TARIK SALDO GAME AGAR POIN SINKRON ---
        const { data: userDb } = await db.from('tabel_siswa').select('saldo_game').eq('nis', currentUser.nis).single();
        if (userDb) currentUser.saldo_game = userDb.saldo_game || 0;

        const poinHadir = totalHadir * 10;
        const poinIzin = totalIzin * 2;
        const poinGame = currentUser.saldo_game || 0;
        
        const totalPoin = poinHadir + poinIzin + poinGame; 
        
        const elPoin = document.getElementById('banner-prestasi-poin');
        const elGelar = document.getElementById('banner-prestasi-gelar');
        
        const elMotivasi = document.getElementById('banner-prestasi-motivasi');
        const elBintang = document.getElementById('banner-prestasi-bintang');

        if (elPoin) elPoin.innerText = totalPoin;

        // Tentukan Gelar dan Bintang berdasarkan jumlah Poin
        if (totalPoin >= 200) {
            if(elGelar) elGelar.innerText = "Siswa Teladan";
            if(elMotivasi) elMotivasi.innerText = "Luar biasa! Kehadiran dan kedisiplinanmu patut diacungi jempol.";
            if(elBintang) elBintang.innerHTML = '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>';
        } else if (totalPoin >= 100) {
            if(elGelar) elGelar.innerText = "Siswa Rajin";
            if(elMotivasi) elMotivasi.innerText = "Bagus sekali! Pertahankan terus semangat belajarmu.";
            if(elBintang) elBintang.innerHTML = '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i>';
        } else {
            if(elGelar) elGelar.innerText = "Siswa Aktif";
            if(elMotivasi) elMotivasi.innerText = "Ayo tingkatkan terus kehadiranmu untuk meraih gelar Teladan.";
            if(elBintang) elBintang.innerHTML = '<i class="fas fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
        }
        // ---------------------------------------------------
    } catch (e) {
        console.error("Gagal load statistik kehadiran bulanan:", e);
    }
}

// ==========================================
// LACI RINCIAN POIN (BOTTOM SHEET)
// ==========================================
function bukaSheetPoin() {
    const sheet = document.getElementById('sheet-rincian-poin');
    const overlay = document.getElementById('sheet-poin-overlay');
    const content = document.getElementById('sheet-poin-content');
    
    if (sheet && overlay && content) {
        // Tampilkan container utamanya
        sheet.classList.remove('hidden');
        
        // Sedikit jeda agar browser memproses penghapusan 'hidden' sebelum animasi jalan
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            overlay.classList.add('opacity-100');
            content.classList.remove('translate-y-full');
            content.classList.add('translate-y-0');
        }, 10);

        // Render isi daftar poin
        renderDaftarPoinBulanIni();
    }
}

function tutupSheetPoin() {
    const sheet = document.getElementById('sheet-rincian-poin');
    const overlay = document.getElementById('sheet-poin-overlay');
    const content = document.getElementById('sheet-poin-content');
    
    if (sheet && overlay && content) {
        // Jalankan animasi mundur
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');
        content.classList.remove('translate-y-0');
        content.classList.add('translate-y-full');
        
        // Sembunyikan container setelah animasi selesai (300ms)
        setTimeout(() => {
            sheet.classList.add('hidden');
        }, 300);
    }
}

function renderDaftarPoinBulanIni() {
    const listContainer = document.getElementById('list-rincian-poin');
    const totalHadirText = document.getElementById('kpi-hadir')?.innerText || "0";
    const totalIzinText = document.getElementById('kpi-izin')?.innerText || "0";
    
    const hadir = parseInt(totalHadirText);
    const izin = parseInt(totalIzinText);
    
    // Perhitungan sama persis dengan yang ada di loadStatistikKehadiranBulanIni()
    const poinHadir = hadir * 10;
    const poinIzin = izin * 2;
    const total = poinHadir + poinIzin;
    
    // Sinkronkan angka besar di header laci
    const elTotalPoin = document.getElementById('sheet-total-poin');
    if (elTotalPoin) elTotalPoin.innerText = total;

    if (total === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-6">
                <i class="fas fa-ghost text-slate-600 text-3xl mb-2 opacity-50"></i>
                <p class="text-xs text-slate-500 font-medium">Belum ada poin terkumpul bulan ini.<br>Ayo tingkatkan kehadiranmu!</p>
            </div>`;
        return;
    }

    let html = '';    
    if (hadir > 0) {
        html += `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/20 shrink-0">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div>
                    <h4 class="font-bold text-xs text-slate-200">Presensi Kehadiran</h4>
                    <p class="text-[9px] text-slate-400 mt-0.5">${hadir} Hari x 10 Poin</p>
                </div>
            </div>
            <div class="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                +${poinHadir}
            </div>
        </div>`;
    }

    if (izin > 0) {
        html += `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm border border-amber-500/20 shrink-0">
                    <i class="fas fa-envelope-open-text"></i>
                </div>
                <div>
                    <h4 class="font-bold text-xs text-slate-200">Izin Terkonfirmasi</h4>
                    <p class="text-[9px] text-slate-400 mt-0.5">${izin} Hari x 2 Poin</p>
                </div>
            </div>
            <div class="font-mono font-extrabold text-sm text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                +${poinIzin}
            </div>
        </div>`;
    }
    listContainer.innerHTML = html;
}

// --- LOGIKA TAB LACI (RIWAYAT VS KLASEMEN) ---
function switchTabPoin(target) {
    const slider = document.getElementById('slider-bg-tab');
    const btnRiwayat = document.getElementById('btn-tab-riwayat');
    const btnKlasemen = document.getElementById('btn-tab-klasemen');
    const kontenRiwayat = document.getElementById('konten-tab-riwayat');
    const kontenKlasemen = document.getElementById('konten-tab-klasemen');

    if (target === 'riwayat') {
        slider.style.left = '0%';
        btnRiwayat.classList.replace('text-slate-400', 'text-white');
        btnKlasemen.classList.replace('text-white', 'text-slate-400');
        
        kontenRiwayat.classList.remove('hidden');
        setTimeout(() => kontenRiwayat.classList.remove('opacity-0'), 10);
        kontenKlasemen.classList.add('opacity-0');
        setTimeout(() => kontenKlasemen.classList.add('hidden'), 300);
        
    } else if (target === 'klasemen') {
        slider.style.left = '50%';
        btnKlasemen.classList.replace('text-slate-400', 'text-white');
        btnRiwayat.classList.replace('text-white', 'text-slate-400');
        
        kontenKlasemen.classList.remove('hidden');
        setTimeout(() => kontenKlasemen.classList.remove('opacity-0'), 10);
        kontenRiwayat.classList.add('opacity-0');
        setTimeout(() => kontenRiwayat.classList.add('hidden'), 300);
        
        // Picu perhitungan klasemen kelas jika belum ditarik
        loadKlasemenKelasBulanIni();
    }
}

// --- MESIN PERHITUNGAN KLASEMEN KELAS ---
let cacheKlasemenBulanIni = null;

async function loadKlasemenKelasBulanIni() {
    if (!currentUser || currentUser.role !== 'siswa') return;
    const kelasSiswa = currentUser.kelas;
    document.getElementById('label-klasemen-kelas').innerText = `Kelas ${kelasSiswa || 'Kosong'}`;
    const listContainer = document.getElementById('list-klasemen-poin');
    const infoPesaing = document.getElementById('info-pesaing');

    if (cacheKlasemenBulanIni) {
        renderUIKlasemen(cacheKlasemenBulanIni);
        return;
    }

    try {
        const dateObj = new Date();
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const prefixBulan = `${yyyy}-${mm}`;

        // 1. Tarik Semua Siswa di Kelas Tersebut
        const { data: temanSatuKelas, error: errSiswa } = await db.from('tabel_siswa').select('nis, nama, foto_profil').eq('kelas', kelasSiswa);
        if (errSiswa || !temanSatuKelas) throw new Error("Gagal menarik teman sekelas");
        
        const jumlahSiswa = temanSatuKelas.length;
        infoPesaing.innerText = `${jumlahSiswa} Siswa`;

        // 2. Tarik Semua Presensi Kelas Bulan Ini
        // Catatan: Anda harus memastikan tabel_presensi bisa diakses RLS-nya untuk semua siswa satu kelas.
        const { data: presensiKelas, error: errPresensi } = await db.from('tabel_presensi')
            .select('nis')
            .eq('kelas', kelasSiswa)
            .like('tanggal', `${prefixBulan}%`);
            
        // 3. Tarik Semua Izin Bulan Ini
        // Karena tabel_izin mungkin tidak punya kolom kelas, kita tarik izin teman yang nis-nya ada
        const daftarNis = temanSatuKelas.map(s => s.nis);
        const { data: izinKelas } = await db.from('tabel_izin')
            .select('nis')
            .eq('status', 'Disetujui')
            .in('nis', daftarNis)
            .like('tanggal', `${prefixBulan}%`);

        // 4. Proses Kalkulasi (On-the-Fly)
        let papanSkor = temanSatuKelas.map(siswa => {
            // Hitung absensi
            const jmlHadir = presensiKelas ? presensiKelas.filter(p => p.nis === siswa.nis).length : 0;
            const jmlIzin = izinKelas ? izinKelas.filter(i => i.nis === siswa.nis).length : 0;
            const totalPoin = (jmlHadir * 10) + (jmlIzin * 2);
            
            return {
                nis: siswa.nis,
                nama: siswa.nama.split(' ').slice(0, 2).join(' '), // Ambil 2 kata depan saja
                foto: siswa.foto_profil,
                poin: totalPoin
            };
        });

        // 5. Urutkan dari Poin Tertinggi ke Terendah (Sort Descending)
        papanSkor.sort((a, b) => b.poin - a.poin);
        
        // Simpan di cache agar tidak memberatkan database jika laci dibuka tutup
        cacheKlasemenBulanIni = papanSkor;
        
        // 6. Tampilkan ke Layar
        renderUIKlasemen(papanSkor);

    } catch (e) {
        console.error("Gagal menghitung klasemen:", e);
        listContainer.innerHTML = `<p class="text-center text-xs text-red-400 py-4">Gagal memuat klasemen. ${e.message}</p>`;
        infoPesaing.innerText = "Error";
    }
}

function renderUIKlasemen(dataKlasemen) {
    const listContainer = document.getElementById('list-klasemen-poin');
    
    if (!dataKlasemen || dataKlasemen.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-xs text-slate-500 py-4">Belum ada data poin.</p>';
        return;
    }

    let html = '';
    
    dataKlasemen.forEach((siswa, index) => {
        const rank = index + 1;
        const isSaya = siswa.nis === currentUser.nis;
        
        // Penyesuaian Visual Berdasarkan Peringkat
        let bgStyle = isSaya ? 'bg-slate-700/80 border-slate-500' : 'bg-slate-800/40 border-slate-700/50';
        let rankVisual = `<span class="text-slate-500 font-extrabold text-sm w-5 text-center">${rank}</span>`;
        let highlightSaya = isSaya ? '<span class="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded ml-1 font-bold">SAYA</span>' : '';
        
        // Perlakuan Khusus Top 3
        if (rank === 1) {
            bgStyle = isSaya ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-gradient-to-r from-yellow-500/10 to-slate-800/40 border-yellow-500/30';
            rankVisual = `<i class="fas fa-medal text-yellow-400 text-xl w-5 text-center drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"></i>`;
        } else if (rank === 2) {
            bgStyle = isSaya ? 'bg-slate-300/20 border-slate-300/50' : 'bg-gradient-to-r from-slate-300/10 to-slate-800/40 border-slate-300/30';
            rankVisual = `<i class="fas fa-medal text-slate-300 text-lg w-5 text-center drop-shadow-[0_0_5px_rgba(203,213,225,0.5)]"></i>`;
        } else if (rank === 3) {
            bgStyle = isSaya ? 'bg-amber-700/30 border-amber-600/50' : 'bg-gradient-to-r from-amber-700/20 to-slate-800/40 border-amber-700/30';
            rankVisual = `<i class="fas fa-medal text-amber-600 text-lg w-5 text-center"></i>`;
        }

        const avatar = siswa.foto 
            ? `<img src="${siswa.foto}" class="w-8 h-8 rounded-full object-cover border border-slate-600">`
            : `<div class="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs"><i class="fas fa-user"></i></div>`;

        html += `
        <div class="flex items-center justify-between p-2.5 rounded-xl border ${bgStyle} transition-colors">
            <div class="flex items-center gap-3">
                ${rankVisual}
                ${avatar}
                <div class="min-w-0">
                    <h4 class="font-bold text-[11px] ${isSaya ? 'text-white' : 'text-slate-300'} truncate flex items-center">${siswa.nama} ${highlightSaya}</h4>
                </div>
            </div>
            <div class="font-mono font-extrabold text-[13px] ${rank <= 3 ? 'text-yellow-400' : 'text-slate-400'}">
                ${siswa.poin} <span class="text-[8px] text-slate-500 ml-0.5">pts</span>
            </div>
        </div>`;
    });
    listContainer.innerHTML = html;
}

// ==========================================
// ARCADE: MEMORY MATCH - EDISI STUDIO PERFILMAN
// ==========================================

let arcadeInterval = null;
let arcadeTime = 0;
let arcadeMoves = 0;
let flippedCards = [];
let matchedPairs = 0;
const totalPairs = 8; // Grid 4x4 = 16 kartu = 8 Pasang
let isGamePlaying = false;

// Array Ikon Khusus Alat Broadcasting & Perfilman
const iconStudioList = [
    'fa-video',           // Kamera Sinema
    'fa-film',            // Clapperboard
    'fa-microphone-alt',  // Mic Podcast/Studio
    'fa-headphones',      // Headphone Monitoring
    'fa-camera-retro',    // Kamera Vintage/Foto
    'fa-lightbulb',       // Lampu Studio (Lighting)
    'fa-broadcast-tower', // Menara Pemancar
    'fa-desktop'          // Monitor Editing
];

async function bukaArcade() {
    tutupSheetPoin(); // Tutup laci poin
    const modal = document.getElementById('modal-arcade');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        await refreshPoinArcade(); // Kalkulasi ulang total poin
    }
}

function tutupArcade() {
    const modal = document.getElementById('modal-arcade');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        clearInterval(arcadeInterval);
        isGamePlaying = false;
    }
}

// Menghitung Saldo Total = (Absen + Izin) + Saldo Game
async function refreshPoinArcade() {
    try {
        const { data } = await db.from('tabel_siswa').select('saldo_game').eq('nis', currentUser.nis).single();
        if (data) currentUser.saldo_game = data.saldo_game || 0;
        
        const dateObj = new Date();
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const prefixBulan = `${yyyy}-${mm}`;
        
        const { data: hadirData } = await db.from('tabel_presensi').select('id').eq('nis', currentUser.nis).like('tanggal', `${prefixBulan}%`);
        const { data: izinData } = await db.from('tabel_izin').select('id').eq('nis', currentUser.nis).eq('status', 'Disetujui').like('tanggal', `${prefixBulan}%`);
        
        const poinHadir = (hadirData ? hadirData.length : 0) * 10;
        const poinIzin = (izinData ? izinData.length : 0) * 2;
        
        const totalPoinSekarang = poinHadir + poinIzin + (currentUser.saldo_game || 0);
        
        const elArcadeUser = document.getElementById('arcade-poin-user');
        if (elArcadeUser) elArcadeUser.innerText = totalPoinSekarang;
        
        const elTotalLaci = document.getElementById('sheet-total-poin');
        if (elTotalLaci) elTotalLaci.innerText = totalPoinSekarang;
        const elBannerDepan = document.getElementById('banner-prestasi-poin');
        if (elBannerDepan) elBannerDepan.innerText = totalPoinSekarang;
        
        return totalPoinSekarang;
    } catch (e) {
        console.error("Gagal refresh poin arcade:", e);
        return 0;
    }
}

async function mulaiGameMemory() {
    const btnMulai = document.getElementById('btn-mulai-game');
    const hargaMain = 20;
    
    const totalPoin = await refreshPoinArcade();
    if (totalPoin < hargaMain) {
        return showToast(`Poin tidak cukup! Butuh ${hargaMain} Pts untuk bermain.`, true);
    }

    btnMulai.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btnMulai.disabled = true;

    try {
        const saldoBaru = (currentUser.saldo_game || 0) - hargaMain;
        const { error } = await db.from('tabel_siswa').update({ saldo_game: saldoBaru }).eq('nis', currentUser.nis);
        if (error) throw error;
        
        currentUser.saldo_game = saldoBaru;
        await refreshPoinArcade();
        
        initPapanMemory();
        btnMulai.innerHTML = '<i class="fas fa-play"></i> MAIN LAGI (20 Pts)';
        btnMulai.disabled = false;
        
    } catch (e) {
        showToast("Gagal memotong poin. Periksa jaringan.", true);
        btnMulai.innerHTML = '<i class="fas fa-play"></i> MAIN (20 Pts)';
        btnMulai.disabled = false;
    }
}

function initPapanMemory() {
    isGamePlaying = true;
    arcadeTime = 0;
    arcadeMoves = 0;
    flippedCards = [];
    matchedPairs = 0;
    
    document.getElementById('arcade-timer').innerText = "00:00";
    document.getElementById('arcade-moves').innerText = "0";
    
    const grid = document.getElementById('arcade-grid');
    grid.classList.remove('opacity-50', 'pointer-events-none');
    grid.innerHTML = ''; 

    // Duplikasi ikon studio agar jadi 16 kartu berpasangan & diacak
    let cards = [...iconStudioList, ...iconStudioList];
    cards.sort(() => Math.random() - 0.5);

    cards.forEach((icon, index) => {
        const card = document.createElement('div');
        // Kartu Glassmorphism Tema Studio
        card.className = "aspect-square bg-slate-800/80 backdrop-blur-md rounded-2xl cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-all duration-300 flex items-center justify-center text-2xl border border-slate-700 hover:border-yellow-500/50 hover:scale-105 active:scale-95";
        card.dataset.icon = icon;
        
        // Sisi Depan & Belakang Kartu
        card.innerHTML = `
            <div class="card-front text-slate-500 opacity-40"><i class="fas fa-question-circle"></i></div>
            <div class="card-back text-yellow-400 hidden drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"><i class="fas ${icon}"></i></div>
        `;
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });

    clearInterval(arcadeInterval);
    arcadeInterval = setInterval(() => {
        arcadeTime++;
        const m = String(Math.floor(arcadeTime / 60)).padStart(2, '0');
        const s = String(arcadeTime % 60).padStart(2, '0');
        document.getElementById('arcade-timer').innerText = `${m}:${s}`;
    }, 1000);
}

function flipCard(card) {
    if (!isGamePlaying) return;
    if (flippedCards.length >= 2) return;
    if (card.classList.contains('flipped')) return;

    // Animasi buka kartu (Tema Neon Kuning Studio)
    card.classList.add('flipped', 'bg-gradient-to-br', 'from-slate-800', 'to-slate-900', 'border-yellow-500/80', 'shadow-[0_0_15px_rgba(250,204,21,0.2)]');
    card.classList.remove('bg-slate-800/80', 'border-slate-700');
    card.querySelector('.card-front').classList.add('hidden');
    card.querySelector('.card-back').classList.remove('hidden');

    flippedCards.push(card);

    if (flippedCards.length === 2) {
        arcadeMoves++;
        document.getElementById('arcade-moves').innerText = arcadeMoves;
        cekKecocokan();
    }
}

function cekKecocokan() {
    const [card1, card2] = flippedCards;
    const match = card1.dataset.icon === card2.dataset.icon;

    if (match) {
        matchedPairs++;
        
        // Ubah jadi nuansa hijau neon jika cocok
        [card1, card2].forEach(c => {
            c.classList.remove('border-yellow-500/85', 'shadow-[0_0_15px_rgba(250,204,21,0.2)]');
            c.classList.add('bg-gradient-to-br', 'from-emerald-900/60', 'to-slate-900', 'border-emerald-500', 'shadow-[0_0_20px_rgba(16,185,129,0.4)]', 'animate-pulse');
            c.querySelector('.card-back').className = "card-back text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]";
        });

        flippedCards = [];

        if (matchedPairs === totalPairs) {
            gameSelesai();
        }
    } else {
        // Tutup kembali jika salah
        setTimeout(() => {
            [card1, card2].forEach(c => {
                c.classList.remove('flipped', 'bg-gradient-to-br', 'from-slate-800', 'to-slate-900', 'border-yellow-500/80', 'shadow-[0_0_15px_rgba(250,204,21,0.2)]');
                c.classList.add('bg-slate-800/80', 'border-slate-700');
                c.querySelector('.card-front').classList.remove('hidden');
                c.querySelector('.card-back').classList.add('hidden');
            });
            flippedCards = [];
        }, 750);
    }
}

async function gameSelesai() {
    isGamePlaying = false;
    clearInterval(arcadeInterval);
    const hadiah = 50;
    
    try {
        const saldoBaru = (currentUser.saldo_game || 0) + hadiah;
        await db.from('tabel_siswa').update({ saldo_game: saldoBaru }).eq('nis', currentUser.nis);
        currentUser.saldo_game = saldoBaru;
        await refreshPoinArcade();
        
        const grid = document.getElementById('arcade-grid');
        grid.classList.add('opacity-50', 'pointer-events-none');
        grid.innerHTML = `
            <div class="col-span-4 text-center text-emerald-400 text-xs py-10 font-bold bg-emerald-900/30 rounded-2xl border border-emerald-500/30">
                <i class="fas fa-trophy text-5xl mb-4 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]"></i><br>
                <span class="text-white text-lg drop-shadow-md">KAMU MENANG!</span><br>
                <span class="text-yellow-400 font-extrabold text-xl">+${hadiah} Poin</span><br>
                <div class="mt-3 text-slate-300 font-medium">Waktu: ${arcadeTime}s | Langkah: ${arcadeMoves}</div>
            </div>
        `;
        showToast(`Hebat! +${hadiah} Poin ditambahkan ke dompetmu!`);
    } catch(e) {
        console.error(e);
        showToast("Gagal menyimpan hadiah poin.", true);
    }
}
