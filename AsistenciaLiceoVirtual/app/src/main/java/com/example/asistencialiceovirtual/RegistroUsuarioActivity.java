package com.example.asistencialiceovirtual;

import android.os.Bundle;
import android.text.InputFilter;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.android.material.button.MaterialButton;

public class RegistroUsuarioActivity extends AppCompatActivity {

    private View progressRegistro;
    private MaterialButton btnRegistrar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_registro_usuario);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.registroRoot), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        TextView txtToolbarTitle = findViewById(R.id.txtToolbarTitle);
        txtToolbarTitle.setText(R.string.registro_title);
        findViewById(R.id.txtToolbarSubtitle).setVisibility(View.GONE);
        findViewById(R.id.btnToolbarBack).setOnClickListener(v -> finish());

        EditText nombre = findViewById(R.id.txtNombreCompletoRegistro);
        EditText dni = findViewById(R.id.txtDniRegistro);
        EditText clave = findViewById(R.id.txtClaveRegistro);
        btnRegistrar = findViewById(R.id.btnRegistrarUsuario);
        progressRegistro = findViewById(R.id.progressRegistro);

        nombre.setFilters(new InputFilter[]{
                (source, start, end, dest, dstart, dend) -> {
                    for (int i = start; i < end; i++) {
                        if (Character.isDigit(source.charAt(i))) {
                            return "";
                        }
                    }
                    return null;
                }
        });

        dni.setFilters(new InputFilter[]{new InputFilter.LengthFilter(8)});

        btnRegistrar.setOnClickListener(v -> intentarRegistrar(nombre, dni, clave));
    }

    private void intentarRegistrar(EditText nombreField, EditText dniField, EditText claveField) {
        String nombreTxt = nombreField.getText().toString();
        String dniTxt = dniField.getText().toString();
        String claveTxt = claveField.getText().toString();

        Integer errNombre = RegistroValidator.validarNombreCompleto(nombreTxt);
        if (errNombre != null) {
            Toast.makeText(this, getString(errNombre), Toast.LENGTH_LONG).show();
            return;
        }
        Integer errDni = RegistroValidator.validarDni(dniTxt);
        if (errDni != null) {
            Toast.makeText(this, getString(errDni), Toast.LENGTH_LONG).show();
            return;
        }
        Integer errClave = RegistroValidator.validarClave(claveTxt);
        if (errClave != null) {
            Toast.makeText(this, getString(errClave), Toast.LENGTH_LONG).show();
            return;
        }

        String nombreOk = nombreTxt.trim().replaceAll("\\s+", " ");
        String dniOk = dniTxt.trim();

        setLoading(true);
        FirebaseRegistroHelper.registrarUsuario(this, nombreOk, dniOk, claveTxt,
                new FirebaseRegistroHelper.RegistroListener() {
                    @Override
                    public void onSuccess() {
                        setLoading(false);
                        Toast.makeText(RegistroUsuarioActivity.this,
                                R.string.registro_exito, Toast.LENGTH_LONG).show();
                        finish();
                    }

                    @Override
                    public void onFailure(String message) {
                        setLoading(false);
                        Toast.makeText(RegistroUsuarioActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void setLoading(boolean loading) {
        progressRegistro.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnRegistrar.setEnabled(!loading);
    }
}
