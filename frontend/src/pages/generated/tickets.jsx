// Native React page. Data contract: backoffice/tabs/tickets.
import { Fragment, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <div className={"card"}>
        <div className={"card-b tight tbl-wrap"}>
          <table className={"table"}>
            <thead>
              <tr>
                <th>{"Ticket"}</th>
                <th>{"Unit"}</th>
                <th>{"Fault"}</th>
                <th>{"Cover"}</th>
                <th>{"Technician"}</th>
                <th>{"Status"}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows1?.length ? (
                data.rows1.map((row1, index) => (
                  <Fragment key={index}>
                    <tr>
                      <td>
                        <a
                          className={"mono"}
                          href={"/app/help/tickets/" + text(row1.v2) + "/"}
                        >
                          {row1.v3}
                        </a>
                        <div className={"tiny faint"}>{row1.v4}</div>
                      </td>
                      <td>
                        {row1.v5}
                        <div className={"tiny mono faint"}>{row1.v6}</div>
                      </td>
                      <td>{row1.v7}</td>
                      <td>
                        {row1.choice8 === 0 ? (
                          <>
                            <span className={"badge b-green"}>
                              {"Warranty"}
                            </span>
                          </>
                        ) : row1.choice8 === 1 ? (
                          <>
                            <span className={"badge b-red"}>{"Billable"}</span>
                          </>
                        ) : row1.choice8 === 2 ? (
                          <>
                            <span className={"badge b-grey"}>
                              {"Unchecked"}
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td>{row1.v9}</td>
                      <td>
                        <span className={"badge " + text(row1.v10)}>
                          {row1.v11}
                        </span>
                      </td>
                    </tr>
                  </Fragment>
                ))
              ) : (
                <>
                  <tr>
                    <td colSpan={"6"} className={"empty"}>
                      {"No service tickets for this project."}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {"\n"}
    </>
  );
}
