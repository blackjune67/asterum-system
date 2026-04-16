import type { ScopeType } from '../../types/schedule'

interface Props {
  open: boolean
  mode: 'edit' | 'delete'
  onPick: (scope: ScopeType) => void
  onClose: () => void
}

export function ScopePickerModal({ open, mode, onPick, onClose }: Props) {
  if (!open) return null

  return (
    <div className="dream-overlay fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="dream-modal max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Scope Track</p>
        <h3 className="mt-2 text-xl font-semibold text-ink">{mode === 'edit' ? '수정 범위 선택' : '삭제 범위 선택'}</h3>
        <p className="mt-2 text-sm text-plum">반복 일정은 적용 범위를 선택해야 합니다.</p>
        <div className="mt-5 grid gap-2">
          <button className="dream-button-primary text-left" onClick={() => onPick('THIS')}>
            해당 일정만
          </button>
          <button className="dream-button-secondary text-left" onClick={() => onPick('FOLLOWING')}>
            이후 모든 일정
          </button>
          <button className="dream-button-secondary text-left" onClick={() => onPick('ALL')}>
            전체 일정
          </button>
        </div>
        <button className="mt-4 text-sm text-plum" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
