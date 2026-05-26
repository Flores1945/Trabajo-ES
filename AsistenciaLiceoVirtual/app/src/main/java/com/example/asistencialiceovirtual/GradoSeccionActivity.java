package com.example.asistencialiceovirtual;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.android.material.button.MaterialButton;

import java.util.List;

/**
 * Pantalla legada; el flujo principal usa {@link NivelEscolarActivity} con paneles expandibles.
 */
public class GradoSeccionActivity extends AppCompatActivity {

    public static final String EXTRA_NIVEL = "extra_nivel";
    public static final String NIVEL_PRIMARIA = "primaria";
    public static final String NIVEL_SECUNDARIA = "secundaria";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_grado_seccion);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.gradoRoot), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        String turno = getIntent().getStringExtra(NivelEscolarActivity.EXTRA_TURNO);
        String nivel = getIntent().getStringExtra(EXTRA_NIVEL);
        String docenteNombre = getIntent().getStringExtra(NivelEscolarActivity.EXTRA_DOCENTE_NOMBRE);
        if (turno == null || nivel == null) {
            finish();
            return;
        }

        String nivelFirebase = CatalogoEscolar.nivelFirebaseDesdeApk(nivel);

        TextView txtToolbarTitle = findViewById(R.id.txtToolbarTitle);
        TextView txtToolbarSubtitle = findViewById(R.id.txtToolbarSubtitle);
        txtToolbarTitle.setText(R.string.grado_seccion_title);
        txtToolbarSubtitle.setVisibility(View.VISIBLE);
        txtToolbarSubtitle.setText(buildSubtitle(turno, nivelFirebase));
        findViewById(R.id.btnToolbarBack).setOnClickListener(v -> finish());

        Spinner spinnerGrado = findViewById(R.id.spinnerGrado);
        Spinner spinnerSeccion = findViewById(R.id.spinnerSeccion);
        MaterialButton btnConfirmar = findViewById(R.id.btnConfirmarSeleccion);

        spinnerGrado.setAdapter(crearAdapter(CatalogoEscolar.gradosPorNivel(nivelFirebase)));
        spinnerSeccion.setAdapter(crearAdapter(CatalogoEscolar.secciones()));

        btnConfirmar.setOnClickListener(v -> {
            String grado = spinnerGrado.getSelectedItem().toString();
            String seccion = spinnerSeccion.getSelectedItem().toString();
            Intent intent = new Intent(this, ListaAlumnosActivity.class);
            intent.putExtra(NivelEscolarActivity.EXTRA_TURNO, turno);
            intent.putExtra(ListaAlumnosActivity.EXTRA_NIVEL, nivelFirebase);
            intent.putExtra(ListaAlumnosActivity.EXTRA_GRADO, grado);
            intent.putExtra(ListaAlumnosActivity.EXTRA_SECCION, seccion);
            intent.putExtra(ListaAlumnosActivity.EXTRA_DOCENTE_NOMBRE, docenteNombre);
            startActivity(intent);
        });
    }

    private ArrayAdapter<String> crearAdapter(List<String> items) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                R.layout.item_spinner,
                items);
        adapter.setDropDownViewResource(R.layout.item_spinner_dropdown);
        return adapter;
    }

    private String buildSubtitle(String turno, String nivelFirebase) {
        String turnoTxt = NivelEscolarActivity.TURNO_TARDE.equals(turno)
                ? getString(R.string.turno_tarde_corto)
                : getString(R.string.turno_manana_corto);
        return getString(R.string.nivel_turno_linea, nivelFirebase, turnoTxt);
    }
}
