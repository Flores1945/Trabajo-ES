package com.example.asistencialiceovirtual;

import android.content.Intent;
import android.os.Bundle;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.bumptech.glide.Glide;

public class HomeActivity extends AppCompatActivity {

    public static final String EXTRA_FULL_NAME = "extra_full_name";
    public static final String EXTRA_CARGO = "extra_cargo";
    /** URL de foto opcional (desde Firebase {@code fotoUrl} o {@code foto}). */
    public static final String EXTRA_PHOTO_URL = "extra_photo_url";

    private String fullName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_home);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.homeRoot), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        Intent intent = getIntent();
        fullName = intent.getStringExtra(EXTRA_FULL_NAME);
        String cargo = intent.getStringExtra(EXTRA_CARGO);
        String photoUrl = intent.getStringExtra(EXTRA_PHOTO_URL);

        TextView nameView = findViewById(R.id.txtNombreCompleto);
        Chip chipCargo = findViewById(R.id.chipCargo);
        ImageView photoView = findViewById(R.id.imgFotoPerfil);
        nameView.setText(fullName != null ? fullName : getString(R.string.usuario));

        if (cargo != null && !cargo.trim().isEmpty()) {
            chipCargo.setText(cargo.trim());
        } else {
            chipCargo.setText(getString(R.string.home_rol_hint));
        }

        if (photoUrl != null && !photoUrl.trim().isEmpty()) {
            Glide.with(this)
                    .load(photoUrl.trim())
                    .circleCrop()
                    .placeholder(R.drawable.avatar_alumno_a)
                    .error(R.drawable.avatar_alumno_a)
                    .into(photoView);
        } else {
            photoView.setImageResource(R.drawable.avatar_alumno_a);
        }

        MaterialButton btnManana = findViewById(R.id.btnTurnoManana);
        MaterialButton btnTarde = findViewById(R.id.btnTurnoTarde);
        MaterialButton btnCerrar = findViewById(R.id.btnCerrarSesion);

        btnManana.setOnClickListener(v -> abrirNivel(NivelEscolarActivity.TURNO_MANANA));
        btnTarde.setOnClickListener(v -> abrirNivel(NivelEscolarActivity.TURNO_TARDE));
        btnCerrar.setOnClickListener(v -> cerrarSesion());
    }

    private void abrirNivel(String turno) {
        Intent intent = new Intent(this, NivelEscolarActivity.class);
        intent.putExtra(NivelEscolarActivity.EXTRA_TURNO, turno);
        intent.putExtra(NivelEscolarActivity.EXTRA_DOCENTE_NOMBRE, fullName);
        startActivity(intent);
    }

    private void cerrarSesion() {
        com.google.firebase.auth.FirebaseAuth.getInstance().signOut();
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
