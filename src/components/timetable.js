// ===== Timetable Component =====

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 10); // 10:00 ~ 21:00

export function renderTimetable(container, match, role, onCellToggle) {
  const seniorTable = match.senior_timetable || [];
  const juniorTable = match.junior_timetable || [];

  let html = `
    <div class="timetable-container">
      <div class="timetable-legend">
        <div class="timetable-legend-item">
          <div class="timetable-legend-dot timetable-legend-dot--senior"></div>
          <span>선배 가능 시간</span>
        </div>
        <div class="timetable-legend-item">
          <div class="timetable-legend-dot timetable-legend-dot--junior"></div>
          <span>후배 가능 시간</span>
        </div>
        <div class="timetable-legend-item">
          <div class="timetable-legend-dot timetable-legend-dot--overlap"></div>
          <span>겹치는 시간 ✨</span>
        </div>
      </div>
      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px">
        ${role === 'senior' ? '🟢 클릭하여 가능한 시간을 표시하세요' : '🔵 클릭하여 가능한 시간을 표시하세요'}
      </div>
      <div style="overflow-x:auto">
        <table class="timetable">
          <thead>
            <tr>
              <th></th>
              ${DAYS.map(d => `<th>${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
  `;

  for (let row = 0; row < 12; row++) {
    const hour = HOURS[row];
    html += '<tr>';
    html += `<td class="time-label">${hour}:00</td>`;

    for (let col = 0; col < 7; col++) {
      const seniorSelected = seniorTable.some(cell => cell.row === row && cell.col === col);
      const juniorSelected = juniorTable.some(cell => cell.row === row && cell.col === col);

      let cellClass = 'cell-empty';
      let cellContent = '';

      if (seniorSelected && juniorSelected) {
        cellClass = 'cell-overlap';
        cellContent = '✓';
      } else if (seniorSelected) {
        cellClass = 'cell-senior';
      } else if (juniorSelected) {
        cellClass = 'cell-junior';
      }

      html += `<td class="${cellClass}" data-row="${row}" data-col="${col}">${cellContent}</td>`;
    }

    html += '</tr>';
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Add click handlers
  container.querySelectorAll('td[data-row]').forEach(cell => {
    cell.addEventListener('click', () => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      if (onCellToggle) onCellToggle(row, col);
    });
  });
}

export function getOverlappingSlots(match) {
  const overlaps = [];
  const seniorTable = match.senior_timetable || [];
  const juniorTable = match.junior_timetable || [];

  seniorTable.forEach(s => {
    if (juniorTable.some(j => j.row === s.row && j.col === s.col)) {
      overlaps.push({
        day: DAYS[s.col],
        hour: HOURS[s.row],
        label: `${DAYS[s.col]} ${HOURS[s.row]}:00`
      });
    }
  });

  return overlaps;
}
