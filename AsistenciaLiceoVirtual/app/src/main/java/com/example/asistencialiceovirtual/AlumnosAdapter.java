package com.example.asistencialiceovirtual;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AlumnosAdapter extends RecyclerView.Adapter<AlumnosAdapter.AlumnoViewHolder> {

    public interface OnAsistenciaClickListener {
        void onAsistenciaClick(Estudiante estudiante, String estado);
    }

    private final List<Estudiante> items = new ArrayList<>();
    private final Map<String, String> estadosPorId = new HashMap<>();
    @Nullable
    private OnAsistenciaClickListener asistenciaListener;

    public void setItems(List<Estudiante> nuevos) {
        items.clear();
        if (nuevos != null) {
            items.addAll(nuevos);
        }
        notifyDataSetChanged();
    }

    public void setOnAsistenciaClickListener(@Nullable OnAsistenciaClickListener listener) {
        this.asistenciaListener = listener;
    }

    public void marcarEstado(String estudianteId, String estado) {
        estadosPorId.put(estudianteId, estado);
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).getId().equals(estudianteId)) {
                notifyItemChanged(i);
                break;
            }
        }
    }

    @NonNull
    @Override
    public AlumnoViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_alumno_asistencia, parent, false);
        return new AlumnoViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AlumnoViewHolder holder, int position) {
        Estudiante e = items.get(position);
        holder.txtNombre.setText(e.getNombresCompletos());
        holder.txtDetalle.setText(holder.itemView.getContext().getString(
                R.string.alumnos_item_detalle,
                e.getGrado(),
                e.getSeccion()));
        int avatar = position % 2 == 0
                ? R.drawable.avatar_alumno_a
                : R.drawable.avatar_alumno_b;
        holder.imgAvatar.setImageResource(avatar);

        String estadoActual = estadosPorId.get(e.getId());
        if (estadoActual != null) {
            holder.txtEstado.setVisibility(View.VISIBLE);
            holder.txtEstado.setText(estadoActual);
            holder.txtEstado.setTextColor(colorParaEstado(holder, estadoActual));
        } else {
            holder.txtEstado.setVisibility(View.GONE);
        }

        holder.btnPuntual.setOnClickListener(v -> notificarAsistencia(e, "Puntual"));
        holder.btnTardanza.setOnClickListener(v -> notificarAsistencia(e, "Tardanza"));
        holder.btnFalta.setOnClickListener(v -> notificarAsistencia(e, "Falta"));
        holder.btnJustificacion.setOnClickListener(v -> notificarAsistencia(e, "Justificacion"));
    }

    private void notificarAsistencia(Estudiante estudiante, String estado) {
        if (asistenciaListener != null) {
            asistenciaListener.onAsistenciaClick(estudiante, estado);
        }
    }

    private int colorParaEstado(AlumnoViewHolder holder, String estado) {
        switch (estado) {
            case "Puntual":
                return holder.itemView.getContext().getColor(R.color.asistencia_puntual);
            case "Tardanza":
                return holder.itemView.getContext().getColor(R.color.asistencia_tardanza);
            case "Falta":
                return holder.itemView.getContext().getColor(R.color.asistencia_falta);
            case "Justificacion":
                return holder.itemView.getContext().getColor(R.color.asistencia_justificacion);
            default:
                return holder.itemView.getContext().getColor(R.color.text_secondary);
        }
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class AlumnoViewHolder extends RecyclerView.ViewHolder {
        final ImageView imgAvatar;
        final TextView txtNombre;
        final TextView txtDetalle;
        final TextView txtEstado;
        final MaterialButton btnPuntual;
        final MaterialButton btnTardanza;
        final MaterialButton btnFalta;
        final MaterialButton btnJustificacion;

        AlumnoViewHolder(@NonNull View itemView) {
            super(itemView);
            imgAvatar = itemView.findViewById(R.id.imgAvatarAlumno);
            txtNombre = itemView.findViewById(R.id.txtNombreAlumno);
            txtDetalle = itemView.findViewById(R.id.txtDetalleAlumno);
            txtEstado = itemView.findViewById(R.id.txtEstadoAsistencia);
            btnPuntual = itemView.findViewById(R.id.btnPuntual);
            btnTardanza = itemView.findViewById(R.id.btnTardanza);
            btnFalta = itemView.findViewById(R.id.btnFalta);
            btnJustificacion = itemView.findViewById(R.id.btnJustificacion);
        }
    }
}
