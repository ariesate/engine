import {
  createElement,
  atom,
  createComponent,
  propTypes
} from 'axii'
import scen from '../pattern'
// TODO 替换成 dayjs
import moment from 'moment';

export function Calendar({ value, current, onSelect, onSelectNextMonth, onSelectLastMonth, onSelectLastYear, onSelectNextYear, onChange }, fragments) {

  return <container inline>

      {fragments.header()(() => (
        <header inline flex-display>
          <lastYear onClick={onSelectLastYear}>{'<<'}</lastYear>
          <lastMonth onClick={onSelectLastMonth} inline inline-margin-left-10px>{'<'}</lastMonth>
          <month inline flex-grow-1>{current.value.year()}年 {current.value.month() + 1}月</month>
          <nextMonth onClick={onSelectNextMonth} inline inline-margin-right-10px>{'>'}</nextMonth>
          <nextYear onClick={onSelectNextYear}>{'>>'}</nextYear>
        </header>
      ))}

    <dates use="table">
      <dayIndexesCotainer use="thead">
        <dayIndexes use="tr">
          {['一', '二', '三', '四', '五', '六', '日'].map(index => (
            <dayIndex
              use="th"
              inline
              inline-display-table-cell
              inline-padding-10px
            >
              {index}
            </dayIndex>
          ))}
        </dayIndexes>
      </dayIndexesCotainer>
      <days use="tbody">
        {fragments.days()(() => {

          // 开始计算有几周
          const startDay = moment(current.value).startOf('month')
          const endDay = moment(current.value).endOf('month')

          const dates = Array(endDay.date()).fill(0).map((_, i) => ({
            year: current.value.year(),
            month: current.value.month(),
            date: i+1,
          }))
          // 往前补
          const startDayOfWeek = startDay.isoWeekday()
          if (startDayOfWeek > 1) {
            const lastMonth = moment(startDay).subtract('1', 'day')
            const lastDayOfLastMonth = lastMonth.date()
            for( let i = startDayOfWeek - 1; i > 0; i-- ) {
              dates.unshift({
                year: lastMonth.year(),
                month: lastMonth.month(),
                date: lastDayOfLastMonth - (startDayOfWeek - i - 1)
              })
            }
          }

          const endDayOfWeek  = endDay.isoWeekday()

          if (endDayOfWeek < 7) {
            const nextMonth = moment(endDay).add('1', 'day')
            for( let i = endDayOfWeek + 1; i < 8; i++) {
              dates.push({
                year: nextMonth.year(),
                month: nextMonth.month(),
                date: i
              })
            }
          }

          // 每 7 个一组
          const datesGroupByWeek = dates.reduce((result, current) => {
            const lastGroup =  result[result.length - 1]
            if (lastGroup.length === 7) {
              result.push([current])
            } else {
              lastGroup.push(current)
            }
            return result
          }, [[]])

          return datesGroupByWeek.map(week => (
            <week use='tr'>{
              week.map(dayData => fragments.day(dayData)(() => {
                if (!dayData.date) debugger
                return (
                  <day
                    use='td'
                    onClick={() => onChange(dayData)}
                    inline
                    inline-display-table-cell
                    inline-padding-10px
                  >
                    {dayData.date}
                  </day>
                )
              }))
            }</week>
          ))
        })}
      </days>
    </dates>
    <div>selected: {() => value.value.format('YYYY-MM-DD')}</div>
  </container>

}

Calendar.propTypes = {
  value: propTypes.object.default(() => atom(moment())),
  current: propTypes.object.default(({ value }) => atom(moment(value))),
  onSelectNextMonth: propTypes.callback.default(() => ({ current }) => {
    current.value = moment(current.value).add(1, 'month')
  }),
  onSelectLastMonth: propTypes.callback.default(() => ({ current }) => {
    current.value = moment(current.value).subtract(1, 'month')
  }),
  onSelectLastYear: propTypes.callback.default(() => ({ current }) => {
    current.value = moment(current.value).subtract(1, 'year')
  }),
  onSelectNextYear: propTypes.callback.default(() => ({ current }) => {
    current.value = moment(current.value).add(1, 'year')
  }),
  onChange: propTypes.callback.default(() => ({year, month, date}, { value }) => {
    value.value = moment().year(year).month(month).date(date)
  })
}

Calendar.Style = (fragments) => {
  fragments.root.elements.container.style({
    background: scen().active().bgColor()
  })

  fragments.header.elements.header.style({
    lineHeight: '40px',
    padding: `0 ${scen().spacing()}px`,
    borderBottom: `1px solid ${scen().separateColor()}`
  })

  fragments.header.elements.month.style({
    textAlign: 'center'
  })

  const commonHandleStyle = {
    cursor: 'pointer',
    userSelect: 'none',
    color: scen().color(-3),
  }

  fragments.header.elements.lastMonth.style(commonHandleStyle)
  fragments.header.elements.nextMonth.style(commonHandleStyle)
  fragments.header.elements.lastYear.style(commonHandleStyle)
  fragments.header.elements.nextYear.style(commonHandleStyle)

  fragments.day.elements.day.style(({ value, year, month, date}) => {

    const equal = (value.value.year() === year && value.value.month() === month && value.value.date() === date)
    return {
      background: equal?
        scen().inverted().active().bgColor() :
        scen().active().bgColor(),
      color: equal ? scen().interactable().active().inverted().color() : scen().color(),
      cursor: 'pointer',
      textAlign: 'center'
    }
  })
}

export default createComponent(Calendar)


