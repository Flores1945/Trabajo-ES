package com.example.asistencialiceovirtual;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.auth.FirebaseAuth;

import java.util.List;

public class ListaAlumnosActivity extends AppCompatActivity {

    public static final String EXTRA_NIVEL = "extra_nivel_firebase";
    public static final String EXTRA_GRADO = "extra_grado";
    public static final String EXTRA_SECCION = "extra_seccion";
    public static final String EXTRA_DOCENTE_NOMBRE = "extra_docente_nombre";

    private ProgressBar progressBar;
    private TextView txtEstado;
    private RecyclerView recyclerView;
    private AlumnosAdapter adapter;
    private String nombreDocente;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_lista_alumnos);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.listaAlumnosRoot), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        if (FirebaseAuth.getInstance().getCurrentUser() == null) {
            finish();
            return;
        }

        String turno = getIntent().getStringExtra(NivelEscolarActivity.EXTRA_TURNO);
        String nivel = getIntent().getStringExtra(EXTRA_NIVEL);
        String grado = getIntent().getStringExtra(EXTRA_GRADO);
        String seccion = getIntent().getStringExtra(EXTRA_SECCION);
        nombreDocente = getIntent().getStringExtra(EXTRA_DOCENTE_NOMBRE);

        if (turno == null || nivel == null || grado == null || seccion == null) {
            finish();
            return;
        }

        if (nombreDocente == null || nombreDocente.trim().isEmpty()) {
            nombreDocente = "Docente APK";
        }

        TextView txtToolbarTitle = findViewById(R.id.txtToolbarTitle);
        TextView txtToolbarSubtitle = findViewById(R.id.txtToolbarSubtitle);
        TextView txtResumenAula = findViewById(R.id.txtResumenAula);

        txtToolbarTitle.setText(R.string.alumnos_title);
        txtToolbarSubtitle.setVisibility(View.VISIBLE);
        txtToolbarSubtitle.setText(buildResumenCorto(nivel, grado, seccion, turno));
        txtResumenAula.setText(buildResumenCorto(nivel, grado, seccion, turno));
        findViewById(R.id.btnToolbarBack).setOnClickListener(v -> finish());

        progressBar = findViewById(R.id.progressAlumnos);
        txtEstado = findViewById(R.id.txtEstadoAlumnos);
        recyclerView = findViewById(R.id.recyclerAlumnos);

        adapter = new AlumnosAdapter();
        adapter.setOnAsistenciaClickListener(this::registrarAsistencia);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);

        cargarAlumnos(turno, nivel, grado, seccion);
    }

    private void registrarAsistencia(Estudiante estudiante, String estado) {
        FirebaseAsistenciaHelper.registrarAsistencia(
                this,
                estudiante,
                estado,
                nombreDocente,
                new FirebaseAsistenciaHelper.AsistenciaListener() {
                    @Override
                    public void onSuccess() {
                        adapter.marcarEstado(estudiante.getId(), estado);
                        Toast.makeText(
                                ListaAlumnosActivity.this,
                                getString(R.string.asistencia_registrada,
                                        estudiante.getNombresCompletos(), estado),
                                Toast.LENGTH_SHORT
                        ).show();
                    }

                    @Override
                    public void onFailure(String message) {
                        Toast.makeText(
                                ListaAlumnosActivity.this,
                                message,
                                Toast.LENGTH_LONG
                        ).show();
                    }
                });
    }

    private void cargarAlumnos(String turno, String nivel, String grado, String seccion) {
        progressBar.setVisibility(View.VISIBLE);
        txtEstado.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);

        FirebaseEstudiantesHelper.cargarPorAula(this, turno, nivel, grado, seccion,
                new FirebaseEstudiantesHelper.EstudiantesListener() {
                    @Override
                    public void onSuccess(List<Estudiante> estudiantes) {
                        progressBar.setVisibility(View.GONE);
                        if (estudiantes.isEmpty()) {
                            txtEstado.setText(R.string.alumnos_vacio);
                            txtEstado.setVisibility(View.VISIBLE);
                            recyclerView.setVisibility(View.GONE);
                            return;
                        }
                        txtEstado.setVisibility(View.GONE);
                        recyclerView.setVisibility(View.VISIBLE);
                        adapter.setItems(estudiantes);
                    }

                    @Override
                    public void onFailure(String message) {
                        progressBar.setVisibility(View.GONE);
                        txtEstado.setText(message);
                        txtEstado.setVisibility(View.VISIBLE);
                        recyclerView.setVisibility(View.GONE);
                    }
                });
    }

    private String buildResumenCorto(String nivel, String grado, String seccion, String turnoApk) {
        String turnoTxt = NivelEscolarActivity.TURNO_TARDE.equals(turnoApk)
                ? getString(R.string.turno_tarde_corto)
                : getString(R.string.turno_manana_corto);
        return getString(R.string.alumnos_resumen_aula, nivel, grado, seccion, turnoTxt);
    }
}
