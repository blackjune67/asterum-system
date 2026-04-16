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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-panel">
        <h3 className="text-xl font-semibold">{mode === 'edit' ? '수정 범위 선택' : '삭제 범위 선택'}</h3>
        <p className="mt-2 text-sm text-slate-600">반복 일정은 적용 범위를 선택해야 합니다.</p>
        <div className="mt-5 grid gap-2">
          <button className="rounded-2xl bg-slate-900 px-4 py-3 text-left text-white" onClick={() => onPick('THIS')}>
            해당 일정만
          </button>
          <button className="rounded-2xl bg-slate-100 px-4 py-3 text-left" onClick={() => onPick('FOLLOWING')}>
            이후 모든 일정
          </button>
          <button className="rounded-2xl bg-slate-100 px-4 py-3 text-left" onClick={() => onPick('ALL')}>
            전체 일정
          </button>
        </div>
        <button className="mt-4 text-sm text-slate-500" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
