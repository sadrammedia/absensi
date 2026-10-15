async function handleLogin() {
    const idInput = document.getElementById('login-id').value.trim();
    const passInput = document.getElementById('login-pass').value;
    const btn = document.getElementById('btn-login');
    const errText = document.getElementById('login-error');
    const currentDeviceId = getDeviceID();
    
    if (!idInput || !passInput) {
        errText.innerText = "NIS dan Kata Sandi wajib diisi!";
        errText.classList.remove('hidden');
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengecek Cloud...';
    btn.disabled = true;
    errText.classList.add('hidden');

    try {
        // HANYA CEK SISWA
        let { data: siswa, error: errSiswa } = await db
            .from('tabel_siswa')
            .select('*')
            .eq('nis', idInput)
            .maybeSingle();

        if (siswa) {
            const pwSiswa = siswa.password || '123456';
            if (passInput !== pwSiswa) {
                throw new Error("Kata Sandi Salah!");
            }

            if (siswa.device_id && siswa.device_id !== currentDeviceId) {
                throw new Error("Akun ini terikat pada HP lain. Hubungi admin untuk reset HP.");
            } else if (!siswa.device_id) {
                await db.from('tabel_siswa').update({ device_id: currentDeviceId }).eq('nis', idInput);
                siswa.device_id = currentDeviceId;
            }

            currentUser = { role: 'siswa', ...siswa };
            localStorage.setItem('app_session', JSON.stringify(currentUser));

            await showScreen('screen-mobile'); 
            setupSiswaDashboard(currentUser);  
            setTimeout(() => { cekUlangTahun(currentUser); }, 1500);
            return;
        }

        throw new Error("NIS atau Kata Sandi tidak terdaftar!");

    } catch (err) {
        console.error(err);
        errText.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> ${err.message || "Gagal masuk."}`;
        errText.classList.remove('hidden');
    } finally {
        btn.innerHTML = '<span class="w-6 h-6 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm"><i class="fas fa-arrow-right text-[10px]"></i></span><span class="text-sm tracking-wide">Masuk Sistem</span>';
        btn.disabled = false;
    }
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('login-pass');
    const eyeIcon = document.getElementById('eye-icon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

async function handleLogout() {
    if (currentUser && currentUser.role === 'siswa') {
        try {
            await db.from('tabel_siswa').update({ device_id: null }).eq('nis', currentUser.nis);
        } catch (e) {
            console.error("Gagal melepas ikatan perangkat:", e);
        }
    }

    currentUser = null;
    localStorage.removeItem('app_session');

    document.getElementById('login-id').value = '';
    document.getElementById('login-pass').value = '';
    showScreen('screen-login');
}

// ==========================================
// FITUR UCAPAN ULANG TAHUN (HANYA RENDER)
// ==========================================
async function cekUlangTahun(user) {
    if (typeof cachedPengaturan !== 'undefined' && cachedPengaturan && cachedPengaturan.fitur_ultah_aktif === false) {
        return; 
    }

    if (!user || !user.tgl_lahir) return; 
    const tglLahirDB = user.tgl_lahir;
    if (tglLahirDB.length < 10) return;

    const bulanLahir = tglLahirDB.substring(5, 7);
    const tanggalLahir = tglLahirDB.substring(8, 10);
    const hariIni = new Date();
    const bulanIni = String(hariIni.getMonth() + 1).padStart(2, '0');
    const tanggalIni = String(hariIni.getDate()).padStart(2, '0');

    if (bulanLahir === bulanIni && tanggalLahir === tanggalIni) {
        document.getElementById('ultah-nama').innerText = user.nama.split(',')[0]; 
        const isPerempuan = (user.jk === 'P' || user.jk === 'Perempuan');
        
        if (typeof cachedPengaturan !== 'undefined' && cachedPengaturan) {
            try {
                const templateAktifId = isPerempuan ? cachedPengaturan.template_p : cachedPengaturan.template_l;
                if (templateAktifId) {
                    const { data: tplData, error } = await db.from('tabel_template_ultah').select('*').eq('id', templateAktifId).single();
                    if (tplData && !error) {
                        document.getElementById('ultah-pesan').innerHTML = tplData.pesan_utama || '';
                        if (tplData.pesan_kutipan) {
                            document.getElementById('ultah-kutipan').innerHTML = `"${tplData.pesan_kutipan}"`;
                            document.getElementById('ultah-kutipan').style.display = 'block';
                        } else {
                            document.getElementById('ultah-kutipan').style.display = 'none';
                        }
                        if (tplData.bg_url) {
                            document.getElementById('ultah-gambar').src = tplData.bg_url;
                        }
                        tampilkanModalUI();
                        return; 
                    }
                }
            } catch (err) {
                console.error("Gagal menarik template ulang tahun dari database:", err);
            }
            
            // Fallback
            if (isPerempuan) {
                document.getElementById('ultah-pesan').innerHTML = "Semoga di hari yang istimewa ini, langkahmu selalu diberkahi, dan kebahagiaan menyertaimu.";
                document.getElementById('ultah-kutipan').innerHTML = `"Jadi versi terbaik dari dirimu" 🤍`;
                document.getElementById('ultah-gambar').src = "https://placehold.co/600x800/ffecf2/ff6b9d.png?text=Selamat+Ulang+Tahun"; 
            } else {
                document.getElementById('ultah-pesan').innerHTML = "Selamat ulang tahun! Jadikan usia barumu ini momentum untuk terus berkembang.";
                document.getElementById('ultah-kutipan').innerHTML = `"Keep moving forward!" 🚀`;
                document.getElementById('ultah-gambar').src = "https://placehold.co/600x800/e0f2fe/0ea5e9.png?text=Selamat+Ulang+Tahun";
            }
            tampilkanModalUI();
        }
    }
}

function tampilkanModalUI() {
    const modal = document.getElementById('modal-ultah');
    const content = document.getElementById('modal-ultah-content');
    if(modal && content) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 50);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    }
}

function tutupModalUltah() {
    const modal = document.getElementById('modal-ultah');
    const content = document.getElementById('modal-ultah-content');
    if(content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
    }
    if(modal) {
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 200);
    }
}