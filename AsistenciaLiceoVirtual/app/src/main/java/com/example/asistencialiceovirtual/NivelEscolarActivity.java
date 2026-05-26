package com.example.asistencialiceovirtual;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.transition.AutoTransition;
import android.transition.TransitionManager;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.android.material.button.MaterialButton;

import java.util.List;

public class NivelEscolarActivity extends AppCompatActivity {

    public static final String EXTRA_TURNO = "extra_turno";
    public static final String EXTRA_DOCENTE_NOMBRE = "extra_docente_nombre";
    public static final String TURNO_MANANA = "manana";
    public static final String TURNO_TARDE = "tarde";

    private static final String PANEL_PRIMARIA = "primaria";
    private static final String PANEL_SECUNDARIA = "secundaria";

    private String turno;
    private String docenteNombre;
    private String panelExpandido = null;

    private LinearLayout panelPrimaria;
    private LinearLayout panelSecundaria;
    private Spinner spinnerGradoPrimaria;
    private Spinner spinnerSeccionPrimaria;
    private Spinner spinnerGradoSecundaria;
    private Spinner spinnerSeccionSecundaria;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_nivel_escolar);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.nivelRoot), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        turno = getIntent().getStringExtra(EXTRA_TURNO);
        docenteNombre = getIntent().getStringExtra(EXTRA_DOCENTE_NOMBRE);
        if (turno == null) {
            finish();
            return;
        }

        TextView txtToolbarTitle = findViewById(R.id.txtToolbarTitle);
        TextView txtToolbarSubtitle = findViewById(R.id.txtToolbarSubtitle);
        txtToolbarTitle.setText(R.string.nivel_title);
        txtToolbarSubtitle.setVisibility(View.VISIBLE);
        txtToolbarSubtitle.setText(turnoLabel(turno));
        findViewById(R.id.btnToolbarBack).setOnClickListener(v -> finish());

        panelPrimaria = findViewById(R.id.panelPrimaria);
        panelSecundaria = findViewById(R.id.panelSecundaria);
        spinnerGradoPrimaria = findViewById(R.id.spinnerGradoPrimaria);
        spinnerSeccionPrimaria = findViewById(R.id.spinnerSeccionPrimaria);
        spinnerGradoSecundaria = findViewById(R.id.spinnerGradoSecundaria);
        spinnerSeccionSecundaria = findViewById(R.id.spinnerSeccionSecundaria);

        configurarSpinners(
                spinnerGradoPrimaria,
                spinnerSeccionPrimaria,
                CatalogoEscolar.NIVEL_PRIMARIA);
        configurarSpinners(
                spinnerGradoSecundaria,
                spinnerSeccionSecundaria,
                CatalogoEscolar.NIVEL_SECUNDARIA);

        MaterialButton btnPrimaria = findViewById(R.id.btnPrimaria);
        MaterialButton btnSecundaria = findViewById(R.id.btnSecundaria);
        MaterialButton btnConfirmarPrimaria = findViewById(R.id.btnConfirmarPrimaria);
        MaterialButton btnConfirmarSecundaria = findViewById(R.id.btnConfirmarSecundaria);

        btnPrimaria.setOnClickListener(v -> alternarPanel(PANEL_PRIMARIA));
        btnSecundaria.setOnClickListener(v -> alternarPanel(PANEL_SECUNDARIA));

        btnConfirmarPrimaria.setOnClickListener(v -> confirmarAula(
                GradoSeccionActivity.NIVEL_PRIMARIA,
                spinnerGradoPrimaria,
                spinnerSeccionPrimaria));
        btnConfirmarSecundaria.setOnClickListener(v -> confirmarAula(
                GradoSeccionActivity.NIVEL_SECUNDARIA,
                spinnerGradoSecundaria,
                spinnerSeccionSecundaria));
    }

    private void configurarSpinners(Spinner spinnerGrado, Spinner spinnerSeccion, String nivelFirebase) {
        List<String> grados = CatalogoEscolar.gradosPorNivel(nivelFirebase);
        spinnerGrado.setAdapter(crearAdapter(grados));
        spinnerSeccion.setAdapter(crearAdapter(CatalogoEscolar.secciones()));
    }

    private ArrayAdapter<String> crearAdapter(List<String> items) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                R.layout.item_spinner,
                items);
        adapter.setDropDownViewResource(R.layout.item_spinner_dropdown);
        return adapter;
    }

    private void alternarPanel(String panel) {
        ViewGroup root = findViewById(R.id.nivelRoot);
        TransitionManager.beginDelayedTransition(root, new AutoTransition());

        if (panel.equals(panelExpandido)) {
            colapsarTodo();
            return;
        }
        panelExpandido = panel;
        panelPrimaria.setVisibility(PANEL_PRIMARIA.equals(panel) ? View.VISIBLE : View.GONE);
        panelSecundaria.setVisibility(PANEL_SECUNDARIA.equals(panel) ? View.VISIBLE : View.GONE);
    }

    private void colapsarTodo() {
        panelExpandido = null;
        panelPrimaria.setVisibility(View.GONE);
        panelSecundaria.setVisibility(View.GONE);
    }

    private void confirmarAula(String nivelApk, Spinner spinnerGrado, Spinner spinnerSeccion) {
        String grado = spinnerGrado.getSelectedItem().toString();
        String seccion = spinnerSeccion.getSelectedItem().toString();
        String nivelFirebase = CatalogoEscolar.nivelFirebaseDesdeApk(nivelApk);

        Intent intent = new Intent(this, ListaAlumnosActivity.class);
        intent.putExtra(EXTRA_TURNO, turno);
        intent.putExtra(ListaAlumnosActivity.EXTRA_NIVEL, nivelFirebase);
        intent.putExtra(ListaAlumnosActivity.EXTRA_GRADO, grado);
        intent.putExtra(ListaAlumnosActivity.EXTRA_SECCION, seccion);
        intent.putExtra(ListaAlumnosActivity.EXTRA_DOCENTE_NOMBRE, docenteNombre);
        startActivity(intent);
    }

    private String turnoLabel(String turnoCodigo) {
        if (TURNO_TARDE.equals(turnoCodigo)) {
            return getString(R.string.turno_actual, getString(R.string.turno_tarde_corto));
        }
        return getString(R.string.turno_actual, getString(R.string.turno_manana_corto));
    }
}
